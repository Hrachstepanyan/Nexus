# Deployment Guide

## Production Checklist

### Pre-Deployment

- [ ] Set environment to `production`
- [ ] Configure proper CORS origins
- [ ] Set up persistent vector storage (PGVector recommended)
- [ ] Configure proper logging (structured logs)
- [ ] Set up monitoring and alerting
- [ ] Configure API rate limiting
- [ ] Review security headers
- [ ] Set up backup strategy for brain data
- [ ] Load test the application
- [ ] Set up CI/CD pipeline

## Deployment Options

### 1. Docker Compose (Simple)

**For small-scale production:**

```bash
# 1. Create production environment file
cp .env.example .env
# Edit .env with production values

# 2. Build images
docker-compose build

# 3. Start services
docker-compose up -d

# 4. Check logs
docker-compose logs -f
```

**Production `docker-compose.yml` modifications:**

```yaml
services:
  quivr-service:
    restart: always
    environment:
      - ENV=production
    # Add volume for persistent storage
    volumes:
      - /data/brains:/app/brains_data

  typescript-client:
    restart: always
    environment:
      - NODE_ENV=production
```

### 2. Kubernetes (Scalable)

**Directory structure:**
```
k8s/
├── namespace.yaml
├── configmap.yaml
├── secrets.yaml
├── python-deployment.yaml
├── python-service.yaml
├── typescript-deployment.yaml
├── typescript-service.yaml
└── ingress.yaml
```

**Example Python Service Deployment:**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: quivr-python-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: quivr-python
  template:
    metadata:
      labels:
        app: quivr-python
    spec:
      containers:
      - name: quivr
        image: your-registry/quivr-service:latest
        ports:
        - containerPort: 8000
        env:
        - name: ANTHROPIC_API_KEY
          valueFrom:
            secretKeyRef:
              name: quivr-secrets
              key: anthropic-key
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
```

### 3. Cloud Platforms

#### AWS

**Services:**
- ECS/EKS for container orchestration
- RDS PostgreSQL with PGVector for storage
- S3 for document storage
- ElastiCache Redis for caching
- ALB for load balancing
- CloudWatch for monitoring

**Recommended Setup:**
```
ALB → ECS Task (TypeScript) → ECS Task (Python) → RDS (PGVector)
                                                 → S3 (Documents)
                                                 → ElastiCache (Cache)
```

#### Google Cloud Platform

- GKE for Kubernetes
- Cloud SQL with PGVector
- Cloud Storage for documents
- Memorystore for caching
- Cloud Load Balancing

#### Azure

- AKS for Kubernetes
- Azure Database for PostgreSQL
- Azure Blob Storage
- Azure Cache for Redis

## Environment Variables

### Production Python Service

```bash
ENV=production
HOST=0.0.0.0
PORT=8000
ANTHROPIC_API_KEY=sk-ant-...
BRAINS_STORAGE_PATH=/data/brains
LOG_LEVEL=INFO
```

### Production TypeScript Client

```bash
NODE_ENV=production
PORT=3000
QUIVR_SERVICE_URL=http://python-service:8000
LOG_LEVEL=warn
```

## Monitoring

### Metrics to Track

1. **Application Metrics:**
   - Request rate and latency
   - Error rate
   - Brain creation/deletion rate
   - Document upload success rate
   - Query response time
   - LLM token usage

2. **System Metrics:**
   - CPU and memory usage
   - Disk I/O
   - Network throughput
   - Container health

3. **Business Metrics:**
   - Active brains
   - Total documents processed
   - API costs (Anthropic)

### Recommended Tools

- **APM**: DataDog, New Relic, or Dynatrace
- **Logging**: ELK Stack, Loki, or CloudWatch
- **Metrics**: Prometheus + Grafana
- **Alerting**: PagerDuty, Opsgenie

## Scaling Strategies

### Horizontal Scaling

**TypeScript Client:**
- Stateless, can scale freely
- Load balance with any method

**Python Service:**
- Load balance with sticky sessions if using in-memory caching
- Better: Use Redis for shared cache

### Vertical Scaling

**When to scale up:**
- Large document processing
- High LLM token requirements
- Complex embeddings

### Performance Optimization

1. **Caching:**
   - Cache frequent queries
   - Cache embeddings
   - Cache LLM responses (if deterministic)

2. **Async Processing:**
   - Queue document uploads
   - Background embedding generation
   - Batch processing

3. **Database Optimization:**
   - Index frequently queried fields
   - Optimize vector search queries
   - Connection pooling

## Security Best Practices

1. **API Keys:**
   - Use secret management (AWS Secrets Manager, HashiCorp Vault)
   - Rotate keys regularly
   - Never log keys

2. **Network:**
   - Use private networks for service-to-service communication
   - Enable HTTPS/TLS
   - Configure firewall rules

3. **Authentication:**
   - Add API authentication (JWT, API keys)
   - Implement rate limiting
   - Add request signing

4. **Data:**
   - Encrypt data at rest
   - Encrypt data in transit
   - Regular backups
   - GDPR compliance if applicable

## Backup & Recovery

### What to Backup

1. Brain metadata (`brains_data/metadata.json`)
2. Uploaded documents
3. Vector indices
4. Configuration

### Backup Strategy

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d)
tar -czf "backup-$DATE.tar.gz" brains_data/
aws s3 cp "backup-$DATE.tar.gz" s3://backups/
```

### Recovery

```bash
# Restore from backup
aws s3 cp s3://backups/backup-20240120.tar.gz .
tar -xzf backup-20240120.tar.gz
# Restart services
```

## Cost Optimization

1. **LLM Costs:**
   - Cache responses
   - Use appropriate models (smaller for simple tasks)
   - Implement token limits

2. **Infrastructure:**
   - Right-size containers
   - Use spot instances where appropriate
   - Auto-scaling policies

3. **Storage:**
   - Compress documents
   - Archive old brains
   - Use appropriate storage tiers

## Troubleshooting

### Common Issues

**Service won't start:**
- Check environment variables
- Verify API keys
- Check port availability

**High memory usage:**
- Limit brain instances in memory
- Implement eviction policy
- Use external vector storage

**Slow queries:**
- Check LLM API latency
- Optimize vector search
- Add caching

**Document upload fails:**
- Check file size limits
- Verify supported formats
- Check disk space
