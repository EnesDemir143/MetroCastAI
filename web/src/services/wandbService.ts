import axios from 'axios';

const WANDB_API_URL = 'https://api.wandb.ai/graphql';

export interface WandBRunMetrics {
    loss: number | null;
    valLoss: number | null;
    mae: number | null;
    valMae: number | null;
    epoch: number | null;
    state: string;
    updatedAt: string;
    duration: number | null;
    totalSteps: number | null;
}

export interface WandBHistoryPoint {
    epoch: number;
    loss: number;
    valMae: number;
}

export const fetchLatestWandBRun = async (entity: string, project: string, apiKey: string): Promise<WandBRunMetrics | null> => {
    const query = `
        query GetLatestFinishedRun($entity: String!, $project: String!) {
            project(name: $project, entityName: $entity) {
                runs(last: 1, filters: "{\"state\": \"finished\"}") {
                    edges {
                        node {
                            name
                            state
                            updatedAt
                            duration
                            summaryMetrics
                        }
                    }
                }
            }
        }
    `;

    try {
        const response = await axios.post(
            WANDB_API_URL,
            {
                query,
                variables: { entity, project },
            },
            {
                headers: {
                    'Authorization': `Basic ${btoa(`api:${apiKey}`)}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const runNode = response.data?.data?.project?.runs?.edges?.[0]?.node;
        if (!runNode) return null;

        const metrics = JSON.parse(runNode.summaryMetrics || '{}');

        return {
            loss: metrics['train/loss'] || metrics['loss'] || null,
            valLoss: metrics['val/loss'] || null,
            mae: metrics['train/mae_celsius'] || null,
            valMae: metrics['val/mae_celsius'] || null,
            epoch: metrics['epoch'] || null,
            state: runNode.state,
            updatedAt: runNode.updatedAt,
            duration: runNode.duration || null,
            totalSteps: metrics['global_step'] || metrics['Step'] || metrics['train/global_step'] || null
        };
    } catch (error) {
        console.error('Error fetching WandB data:', error);
        return null;
    }
};

export const fetchRunHistory = async (entity: string, project: string, apiKey: string): Promise<WandBHistoryPoint[]> => {
    const query = `
        query GetRunHistory($entity: String!, $project: String!) {
            project(name: $project, entityName: $entity) {
                runs(last: 1) {
                    edges {
                        node {
                            sampledHistory(keys: ["train/loss", "val/mae_celsius", "epoch"], samples: 50)
                        }
                    }
                }
            }
        }
    `;

    try {
        const response = await axios.post(
            WANDB_API_URL,
            { query, variables: { entity, project } },
            {
                headers: {
                    'Authorization': `Basic ${btoa(`api:${apiKey}`)}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        // sampledHistory returns a list of history objects for the keys requested
        const historyData = response.data?.data?.project?.runs?.edges?.[0]?.node?.sampledHistory?.[0] || [];
        return historyData.map((item: any) => ({
            epoch: item.epoch || 0,
            loss: item['train/loss'] || 0,
            valMae: item['val/mae_celsius'] || 0,
        })).sort((a: any, b: any) => a.epoch - b.epoch);
    } catch (error) {
        console.error('Error fetching WandB history:', error);
        return [];
    }
};
