import pickle
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import seaborn as sns
import matplotlib.pyplot as plt

# Define label mapping
label_map = {
    0: 'A', 1: 'B', 2: 'C', 3: 'D', 4: 'del', 5: 'E',
    6: 'F', 7: 'G', 8: 'H', 9: 'I', 10: 'J', 11: 'K',
    12: 'L', 13: 'M', 14: 'N', 15: 'nothing', 16: 'O',
    17: 'P', 18: 'Q', 19: 'R', 20: 'S', 21: 'space',
    22: 'T', 23: 'U', 24: 'V', 25: 'W', 26: 'X',
    27: 'Y', 28: 'Z'
}

# Load dataset
print("Loading dataset...")
with open('./data.pickle', 'rb') as f:
    data_dict = pickle.load(f)

data = data_dict['data']
labels = np.array(data_dict['labels'], dtype=np.int32)

# Print initial dataset statistics
print(f"\nDataset Statistics:")
print(f"Total samples: {len(data)}")
unique_labels = np.unique(labels)

# Find classes with too few samples (less than 10 samples)
min_samples_threshold = 10
classes_to_remove = []
for label in unique_labels:
    count = np.sum(labels == label)
    print(f"Class {label_map[label]}: {count} samples")
    if count < min_samples_threshold:
        classes_to_remove.append(label)

# Remove classes with too few samples
if classes_to_remove:
    print(f"\nRemoving classes with less than {min_samples_threshold} samples:")
    for label in classes_to_remove:
        print(f"- {label_map[label]} (only {np.sum(labels == label)} samples)")
    
    mask = ~np.isin(labels, classes_to_remove)
    data = [d for i, d in enumerate(data) if mask[i]]
    labels = labels[mask]
    print(f"Dataset size after removal: {len(data)} samples")

# Ensure all samples have the same length
fixed_length = 63  # 21 landmarks * 3 (x, y, z)
for i in range(len(data)):
    if len(data[i]) < fixed_length:
        data[i] += [0] * (fixed_length - len(data[i]))  # Padding
    else:
        data[i] = data[i][:fixed_length]  # Truncation

# Convert to NumPy array
data = np.array(data, dtype=np.float32)

# Split dataset
x_train, x_test, y_train, y_test = train_test_split(
    data, labels, test_size=0.2, shuffle=True, stratify=labels, random_state=42
)

print(f"\nTraining set shape: {x_train.shape}")
print(f"Testing set shape: {x_test.shape}")

# Initialize and train RandomForest
print("\nTraining Random Forest Classifier...")
model = RandomForestClassifier(
    n_estimators=150,
    max_depth=20,
    min_samples_split=5,
    class_weight='balanced',
    n_jobs=-1,
    random_state=42
)

model.fit(x_train, y_train)

# Evaluate model
y_pred = model.predict(x_test)

# Convert numerical labels to letter labels for reporting
y_test_letters = [label_map[label] for label in y_test]
y_pred_letters = [label_map[label] for label in y_pred]

# Calculate and print accuracy
accuracy = accuracy_score(y_test, y_pred)
print(f"\nOverall Accuracy: {accuracy * 100:.2f}%")

# Print detailed classification report
print("\nDetailed Classification Report:")
print(classification_report(y_test_letters, y_pred_letters))

# Calculate confusion matrix
cm = confusion_matrix(y_test, y_pred)

# Plot confusion matrix
plt.figure(figsize=(20, 20))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
            xticklabels=[label_map[i] for i in sorted(np.unique(labels))],
            yticklabels=[label_map[i] for i in sorted(np.unique(labels))])
plt.title('Confusion Matrix')
plt.xlabel('Predicted')
plt.ylabel('True')
plt.savefig('confusion_matrix.png')
plt.close()

# Save model and metadata
print("\nSaving model and metadata...")
with open('model.p', 'wb') as f:
    pickle.dump({
        'model': model,
        'label_map': label_map,
        'removed_classes': classes_to_remove,
        'feature_importance': model.feature_importances_
    }, f)

print("Model saved successfully! ✅")

# Save training report
with open('training_report.txt', 'w') as f:
    f.write("Sign Language Detection Model Training Report\n")
    f.write("==========================================\n\n")
    f.write(f"Total samples: {len(data)}\n")
    f.write(f"Number of classes: {len(np.unique(labels))}\n")
    if classes_to_remove:
        f.write(f"\nRemoved classes (insufficient samples):\n")
        for label in classes_to_remove:
            f.write(f"- {label_map[label]}\n")
    f.write(f"\nOverall accuracy: {accuracy * 100:.2f}%\n")

print("\nTraining report saved to 'training_report.txt'")
print("Confusion matrix visualization saved to 'confusion_matrix.png'")