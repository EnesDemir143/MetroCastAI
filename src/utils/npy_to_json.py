import numpy as np
import json

def main():
    stats = np.load('data/processed/statistics.npy', allow_pickle=True).item()

    stats_dict = {
        "mean": stats['mean'].tolist(),
        "std": stats['std'].tolist(),
        "input_cols": stats['input_cols']
}

    with open('data/processed/statistics.json', 'w') as f:
        json.dump(stats_dict, f, indent=4)

    print("✓ statistics.json hazır!")  

if __name__ == "__main__":
    main()
    