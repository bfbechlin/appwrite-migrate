import { Client, Databases, ID, Query } from 'node-appwrite';
import { AppConfig } from './config.js';

export const createAppwriteClient = (config: AppConfig) => {
  const client = new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId)
    .setKey(config.apiKey);

  const databases = new Databases(client);

  return { client, databases };
};

export const ensureMigrationCollection = async (databases: Databases, config: AppConfig) => {
  try {
    await databases.getCollection(config.databaseId, config.migrationCollectionId);
  } catch (error: any) {
    if (error.code === 404) {
      console.log(`Creating migration collection '${config.migrationCollectionId}'...`);
      await databases.createCollection(
        config.databaseId,
        config.migrationCollectionId,
        config.migrationCollectionId,
      );
      await databases.createStringAttribute(
        config.databaseId,
        config.migrationCollectionId,
        'name',
        255,
        true,
      );
      await databases.createDatetimeAttribute(
        config.databaseId,
        config.migrationCollectionId,
        'appliedAt',
        true,
      );
    } else {
      throw error;
    }
  }
};

export const getAppliedMigrations = async (
  databases: Databases,
  config: AppConfig,
): Promise<string[]> => {
  try {
    const response = await databases.listDocuments(
      config.databaseId,
      config.migrationCollectionId,
      [Query.limit(5000)],
    );
    return response.documents.map((doc) => doc.$id);
  } catch (error: any) {
    if (error.code === 404) {
      return [];
    }
    throw error;
  }
};

export const recordMigration = async (
  databases: Databases,
  config: AppConfig,
  migrationId: string,
  name: string,
) => {
  await databases.createDocument(config.databaseId, config.migrationCollectionId, migrationId, {
    name,
    appliedAt: new Date().toISOString(),
  });
};
