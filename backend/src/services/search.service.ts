import { elasticsearchClient } from "../config/elasticsearch.js";

const EMAIL_INDEX = "emails";

export interface EmailSearchDocument {
  id: string;
  recipient: string;
  senderEmail: string | null;
  subject: string;
  body: string;
  status: string;
  scheduledAt: string;
  sentAt: string | null;
}

export async function createEmailIndex() {
  const exists = await elasticsearchClient.indices.exists({
    index: EMAIL_INDEX
  });

  if (exists) {
    return;
  }

  await elasticsearchClient.indices.create({
    index: EMAIL_INDEX,
    mappings: {
      properties: {
        id: {
          type: "keyword"
        },
        recipient: {
          type: "text",
          fields: {
            keyword: {
              type: "keyword"
            }
          }
        },
        senderEmail: {
          type: "keyword"
        },
        subject: {
          type: "text"
        },
        body: {
          type: "text"
        },
        status: {
          type: "keyword"
        },
        scheduledAt: {
          type: "date"
        },
        sentAt: {
          type: "date"
        }
      }
    }
  });

  console.log("Elasticsearch email index created");
}

export async function indexEmail(
  email: EmailSearchDocument
) {
  await elasticsearchClient.index({
    index: EMAIL_INDEX,
    id: email.id,
    document: email
  });
}

export async function searchEmails(query: string) {
  const result = await elasticsearchClient.search<EmailSearchDocument>({
    index: EMAIL_INDEX,
    size: 50,
    query: {
      multi_match: {
        query,
        fields: [
          "recipient",
          "senderEmail",
          "subject",
          "body",
          "status"
        ]
      }
    }
  });

  return result.hits.hits.map((hit) => ({
    id: hit._id,
    ...hit._source
  }));
}