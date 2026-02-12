# Usage Examples

## Basic Workflow

### 1. Create a Brain and Add Documents

```typescript
// Using the TypeScript client
import { quivrClient } from './src/client/quivr-client';

async function createKnowledgeBase() {
  // Create a brain
  const brain = await quivrClient.createBrain({
    name: 'Product Documentation',
    description: 'All product manuals and guides',
    llm_provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
  });

  console.log(`Created brain: ${brain.id}`);

  // Upload documents (direct to Python service for now)
  // Using curl or a Python script

  return brain.id;
}
```

### 2. Query the Brain

```typescript
async function askQuestion(brainId: string, question: string) {
  const response = await quivrClient.queryBrain(brainId, {
    question,
    max_tokens: 1024,
    temperature: 0.7,
  });

  console.log(`Question: ${question}`);
  console.log(`Answer: ${response.answer}`);
  console.log(`Processing time: ${response.processing_time_ms}ms`);
}

// Usage
await askQuestion(
  'brain-uuid-here',
  'What are the system requirements?'
);
```

## Advanced Examples

### Multiple Brains for Different Contexts

```typescript
async function setupMultipleBrains() {
  // Legal documents
  const legalBrain = await quivrClient.createBrain({
    name: 'Legal Documents',
    description: 'Contracts, agreements, policies',
    llm_provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
  });

  // Technical documentation
  const techBrain = await quivrClient.createBrain({
    name: 'Technical Docs',
    description: 'API docs, architecture guides',
    llm_provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
  });

  // Support tickets
  const supportBrain = await quivrClient.createBrain({
    name: 'Support History',
    description: 'Past support tickets and resolutions',
    llm_provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
  });

  return { legalBrain, techBrain, supportBrain };
}
```

### Batch Querying

```typescript
async function batchQuery(brainId: string, questions: string[]) {
  const results = await Promise.all(
    questions.map((question) =>
      quivrClient.queryBrain(brainId, {
        question,
        max_tokens: 512,
        temperature: 0.5,
      })
    )
  );

  return questions.map((q, i) => ({
    question: q,
    answer: results[i].answer,
    time: results[i].processing_time_ms,
  }));
}

// Usage
const questions = [
  'What is the main feature?',
  'How do I install it?',
  'What are the pricing tiers?',
];

const answers = await batchQuery('brain-uuid', questions);
answers.forEach(({ question, answer }) => {
  console.log(`Q: ${question}\nA: ${answer}\n`);
});
```

### Error Handling

```typescript
import { QuivrClientError } from './src/client/quivr-client';

async function safeQuery(brainId: string, question: string) {
  try {
    const response = await quivrClient.queryBrain(brainId, {
      question,
    });
    return response.answer;
  } catch (error) {
    if (error instanceof QuivrClientError) {
      if (error.statusCode === 404) {
        console.error('Brain not found');
      } else if (error.statusCode === 400) {
        console.error('Invalid request:', error.message);
      } else {
        console.error('API error:', error.message);
      }
    } else {
      console.error('Unexpected error:', error);
    }
    return null;
  }
}
```

## Express Integration Examples

### Custom Middleware

```typescript
import { Request, Response, NextFunction } from 'express';

// Rate limiting for brain queries
const queryRateLimiter = new Map<string, number[]>();

function rateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const brainId = req.params.id;
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxRequests = 10;

  if (!queryRateLimiter.has(brainId)) {
    queryRateLimiter.set(brainId, []);
  }

  const requests = queryRateLimiter.get(brainId)!;
  const recentRequests = requests.filter((time) => now - time < windowMs);

  if (recentRequests.length >= maxRequests) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      detail: `Max ${maxRequests} requests per minute`,
    });
  }

  recentRequests.push(now);
  queryRateLimiter.set(brainId, recentRequests);
  next();
}

// Apply to query endpoint
app.post('/api/brains/:id/query', rateLimitMiddleware, queryHandler);
```

### Streaming Responses (Future)

```typescript
// When Quivr supports streaming
async function streamQuery(brainId: string, question: string) {
  const stream = await quivrClient.queryBrainStream(brainId, {
    question,
  });

  for await (const chunk of stream) {
    process.stdout.write(chunk);
  }
}
```

## CLI Examples

### Bash Scripts

```bash
#!/bin/bash
# create-brain.sh

BRAIN_ID=$(curl -s -X POST http://localhost:3000/api/brains \
  -H "Content-Type: application/json" \
  -d '{
    "name": "'"$1"'",
    "description": "'"$2"'",
    "llm_provider": "anthropic"
  }' | jq -r '.id')

echo "Created brain: $BRAIN_ID"
echo $BRAIN_ID > .brain_id
```

```bash
#!/bin/bash
# query-brain.sh

BRAIN_ID=$(cat .brain_id)
QUESTION="$1"

curl -X POST "http://localhost:3000/api/brains/$BRAIN_ID/query" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "'"$QUESTION"'"
  }' | jq -r '.answer'
```

**Usage:**
```bash
./create-brain.sh "My Brain" "Description here"
./query-brain.sh "What is the main topic?"
```

## Python Integration

### Direct Python Access

```python
import requests

BASE_URL = "http://localhost:3000/api"

def create_brain(name: str, description: str = None):
    response = requests.post(
        f"{BASE_URL}/brains",
        json={
            "name": name,
            "description": description,
            "llm_provider": "anthropic",
        }
    )
    return response.json()

def query_brain(brain_id: str, question: str):
    response = requests.post(
        f"{BASE_URL}/brains/{brain_id}/query",
        json={"question": question}
    )
    return response.json()

# Usage
brain = create_brain("Research Papers", "Academic research collection")
result = query_brain(brain["id"], "What are the key findings?")
print(result["answer"])
```

## Testing Examples

### Unit Tests (Jest/Vitest)

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { quivrClient } from '../src/client/quivr-client';

describe('Quivr Client', () => {
  let testBrainId: string;

  beforeAll(async () => {
    const brain = await quivrClient.createBrain({
      name: 'Test Brain',
      llm_provider: 'anthropic',
    });
    testBrainId = brain.id;
  });

  it('should create a brain', async () => {
    const brain = await quivrClient.createBrain({
      name: 'Another Test',
    });
    expect(brain).toHaveProperty('id');
    expect(brain.name).toBe('Another Test');
  });

  it('should list brains', async () => {
    const list = await quivrClient.listBrains();
    expect(list.total).toBeGreaterThan(0);
  });

  it('should query a brain', async () => {
    const result = await quivrClient.queryBrain(testBrainId, {
      question: 'Hello?',
    });
    expect(result).toHaveProperty('answer');
  });
});
```

## Production Patterns

### Connection Pooling

```typescript
import axios from 'axios';
import http from 'http';
import https from 'https';

const httpAgent = new http.Agent({
  keepAlive: true,
  maxSockets: 50,
});

const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 50,
});

export const productionClient = axios.create({
  baseURL: process.env.QUIVR_SERVICE_URL,
  httpAgent,
  httpsAgent,
  timeout: 60000,
});
```

### Retry Logic

```typescript
import { quivrClient, QuivrClientError } from './client/quivr-client';

async function queryWithRetry(
  brainId: string,
  question: string,
  maxRetries = 3
) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await quivrClient.queryBrain(brainId, { question });
    } catch (error) {
      if (error instanceof QuivrClientError && error.statusCode === 503) {
        if (attempt === maxRetries) throw error;
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * attempt)
        );
        continue;
      }
      throw error;
    }
  }
}
```

### Circuit Breaker

```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private threshold = 5,
    private timeout = 60000
  ) {}

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failures++;
    this.lastFailTime = Date.now();
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }
}

// Usage
const breaker = new CircuitBreaker();

async function safeQuery(brainId: string, question: string) {
  return breaker.call(() =>
    quivrClient.queryBrain(brainId, { question })
  );
}
```
