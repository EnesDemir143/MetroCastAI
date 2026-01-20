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
        query GetLatestRuns($entity: String!, $project: String!) {
            project(name: $project, entityName: $entity) {
                runs(last: 10) {
                    edges {
                        node {
                            name
                            state
                            updatedAt
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

        if (response.data?.errors) {
            console.error('WandB GraphQL Errors (Metrics):', JSON.stringify(response.data.errors, null, 2));
            return null;
        }

        const runs = response.data?.data?.project?.runs?.edges || [];
        const activeRun = runs.find((edge: any) => edge.node.state === 'finished') || runs.find((edge: any) => edge.node.state === 'running') || runs[0];

        const runNode = activeRun?.node;
        if (!runNode) return null;

        const metrics = JSON.parse(runNode.summaryMetrics || '{}');

        return {
            loss: metrics['train/loss'] || metrics['loss'] || null,
            valLoss: metrics['val/loss'] || null,
            mae: metrics['val/mae_celsius'] || metrics['val/mae'] || metrics['train/mae_celsius'] || null,
            valMae: metrics['val/mae_celsius'] || metrics['val/mae'] || null,
            epoch: metrics['epoch'] || null,
            state: runNode.state,
            updatedAt: runNode.updatedAt,
            duration: null,
            totalSteps: metrics['_step'] || metrics['global_step'] || metrics['Step'] || metrics['train/global_step'] || null
        };
    } catch (error) {
        console.error('Error fetching WandB metrics:', error);
        return null;
    }
};

export const fetchRunHistory = async (entity: string, project: string, apiKey: string): Promise<WandBHistoryPoint[]> => {
    const query = `
        query GetRunHistory($entity: String!, $project: String!) {
            project(name: $project, entityName: $entity) {
                runs(last: 5) {
                    edges {
                        node {
                            state
                            history
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

        if (response.data?.errors) {
            console.error('WandB GraphQL Errors (History):', JSON.stringify(response.data.errors, null, 2));
            // Even if there are errors in some runs, try to proceed with data if present
        }

        const runs = response.data?.data?.project?.runs?.edges || [];
        const activeRun = runs.find((edge: any) => edge.node.state === 'finished') || runs.find((edge: any) => edge.node.state === 'running') || runs[0];

        if (!activeRun?.node?.history) return [];

        const historyRaw = activeRun.node.history;

        // WandB 'history' field usually returns an array of JSON strings
        const points = historyRaw.map((itemStr: string) => {
            try {
                const item = JSON.parse(itemStr);
                return {
                    epoch: item.epoch !== undefined ? item.epoch : (item._step || 0),
                    loss: item['train/loss'] || item['loss'] || 0,
                    valMae: item['val/mae_celsius'] || item['val/mae'] || 0,
                };
            } catch (e) {
                return null;
            }
        }).filter((p: any) => p !== null);

        return points.sort((a: any, b: any) => a.epoch - b.epoch);
    } catch (error) {
        console.error('Error fetching WandB history:', error);
        return [];
    }
};
