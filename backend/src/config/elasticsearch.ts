import dotenv from "dotenv";
import { Client } from "@elastic/elasticsearch";

dotenv.config();

const elasticsearchUrl = process.env.ELASTICSEARCH_URL?.trim();
const elasticsearchUsername =
  process.env.ELASTICSEARCH_USERNAME?.trim();
const elasticsearchPassword =
  process.env.ELASTICSEARCH_PASSWORD?.trim();

if (!elasticsearchUrl) {
  throw new Error(
    "ELASTICSEARCH_URL is missing from .env"
  );
}

if (!elasticsearchUsername) {
  throw new Error(
    "ELASTICSEARCH_USERNAME is missing from .env"
  );
}

if (!elasticsearchPassword) {
  throw new Error(
    "ELASTICSEARCH_PASSWORD is missing from .env"
  );
}

console.log(
  `Elasticsearch URL loaded: ${elasticsearchUrl}`
);

console.log(
  `Elasticsearch username loaded: ${elasticsearchUsername}`
);

console.log(
  `Elasticsearch password loaded: ${"*".repeat(
    Math.min(elasticsearchPassword.length, 12)
  )}`
);

export const elasticsearchClient = new Client({
  node: elasticsearchUrl,
  auth: {
    username: elasticsearchUsername,
    password: elasticsearchPassword
  }
});

export async function checkElasticsearchConnection() {
  try {
    const response = await elasticsearchClient.info();

    console.log(
      `Elasticsearch connected successfully: ${response.cluster_name}`
    );
  } catch (error: any) {
    console.error(
      "Elasticsearch status:",
      error?.meta?.statusCode
    );

    if (error?.meta?.statusCode === 401) {
      throw new Error(
        "Elasticsearch authentication failed. The deployment URL works, but the elastic username/password is incorrect."
      );
    }

    throw error;
  }
}