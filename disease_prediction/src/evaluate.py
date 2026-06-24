"""
Disease Prediction System - Model Evaluation Module

This module provides functions to calculate, print, and compare model 
performance metrics. It supports both binary and multi-class classification,
generating detailed reports, plotting multi-class ROC curves, feature importances,
and validating model generalization.
"""

import os
import matplotlib
matplotlib.use('Agg')  # Set non-interactive backend for headless environments
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import numpy as np
from sklearn.model_selection import cross_val_score
from sklearn.preprocessing import label_binarize
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report,
    roc_curve,
    auc
)

def calculate_metrics(y_true, y_pred, y_prob=None):
    """
    Calculate classification performance metrics. Supports binary and multi-class.
    """
    unique_classes = np.unique(y_true)
    is_multiclass = len(unique_classes) > 2
    
    if is_multiclass:
        metrics = {
            'accuracy': accuracy_score(y_true, y_pred),
            'precision': precision_score(y_true, y_pred, average='macro', zero_division=0),
            'recall': recall_score(y_true, y_pred, average='macro', zero_division=0),
            'f1_score': f1_score(y_true, y_pred, average='macro', zero_division=0),
        }
    else:
        metrics = {
            'accuracy': accuracy_score(y_true, y_pred),
            'precision': precision_score(y_true, y_pred, zero_division=0),
            'recall': recall_score(y_true, y_pred, zero_division=0),
            'f1_score': f1_score(y_true, y_pred, zero_division=0),
        }
    
    if y_prob is not None:
        try:
            if is_multiclass:
                # Expecting shape (n_samples, n_classes)
                if len(y_prob.shape) > 1 and y_prob.shape[1] > 1:
                    metrics['roc_auc'] = roc_auc_score(y_true, y_prob, multi_class='ovr', average='macro')
                else:
                    # Binarize output prediction as fallback
                    y_prob_bin = label_binarize(y_pred, classes=list(unique_classes))
                    metrics['roc_auc'] = roc_auc_score(y_true, y_prob_bin, multi_class='ovr', average='macro')
            else:
                # For binary, if y_prob has shape (n_samples, 2), extract positive class probabilities
                if len(y_prob.shape) > 1 and y_prob.shape[1] == 2:
                    y_prob_binary = y_prob[:, 1]
                else:
                    y_prob_binary = y_prob
                metrics['roc_auc'] = roc_auc_score(y_true, y_prob_binary)
        except Exception as e:
            metrics['roc_auc'] = np.nan
            print(f"Warning: Could not calculate ROC AUC: {e}")
    else:
        metrics['roc_auc'] = np.nan
        
    metrics['confusion_matrix'] = confusion_matrix(y_true, y_pred)
    return metrics

def display_metrics(model_name, metrics):
    """
    Print the evaluation metrics to the console.
    """
    print("=" * 50)
    print(f" Evaluation Metrics for: {model_name} ")
    print("=" * 50)
    print(f"Accuracy:  {metrics['accuracy']:.4f}")
    print(f"Precision: {metrics['precision']:.4f}")
    print(f"Recall:    {metrics['recall']:.4f}")
    print(f"F1 Score:  {metrics['f1_score']:.4f}")
    if not np.isnan(metrics['roc_auc']):
        print(f"ROC AUC:   {metrics['roc_auc']:.4f}")
    else:
        print("ROC AUC:   N/A")
    print("\nConfusion Matrix:")
    cm = metrics['confusion_matrix']
    if cm.shape == (3, 3):
        print(f"   Act \\ Pred |  No Diabetes (0) |  Pre-Diabetes (1) |  Diabetes (2)")
        print(f"   -----------+------------------+-------------------+--------------")
        print(f"   Class 0    |       {cm[0,0]:10d} |        {cm[0,1]:10d} |   {cm[0,2]:10d}")
        print(f"   Class 1    |       {cm[1,0]:10d} |        {cm[1,1]:10d} |   {cm[1,2]:10d}")
        print(f"   Class 2    |       {cm[2,0]:10d} |        {cm[2,1]:10d} |   {cm[2,2]:10d}")
    else:
        print(f"   TN: {cm[0, 0]:4d} | FP: {cm[0, 1]:4d}")
        print(f"   FN: {cm[1, 0]:4d} | TP: {cm[1, 1]:4d}")
    print("=" * 50)
    print()

def generate_comparison_table(results):
    """
    Compare multiple models and return a sorted DataFrame.
    """
    records = []
    for model_name, metrics in results.items():
        records.append({
            'Model': model_name,
            'Accuracy': metrics['accuracy'],
            'Precision': metrics['precision'],
            'Recall': metrics['recall'],
            'F1 Score': metrics['f1_score'],
            'ROC AUC': metrics['roc_auc']
        })
    
    df_compare = pd.DataFrame(records)
    df_compare = df_compare.sort_values(by=['F1 Score', 'ROC AUC'], ascending=False).reset_index(drop=True)
    return df_compare

def generate_detailed_report(
    model, X_train, y_train, X_test, y_test, feature_names, 
    report_path, roc_path, fi_path, 
    cv_scores=None, baseline_metrics=None, optimized_metrics=None,
    best_model_name="Optimized Model", old_comparison=None
):
    """
    Generate a detailed comparison and evaluation report and save files/charts.
    """
    print("\nGenerating Detailed Evaluation Report...")
    
    # 1. Training & Testing Accuracy
    y_train_pred = model.predict(X_train)
    y_test_pred = model.predict(X_test)
    
    train_acc = accuracy_score(y_train, y_train_pred)
    test_acc = accuracy_score(y_test, y_test_pred)
    
    # 2. Cross Validation (use scores if passed, otherwise compute)
    if cv_scores is None:
        cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring='accuracy')
    mean_cv = np.mean(cv_scores)
    std_cv = np.std(cv_scores)
    
    # Check if target is multi-class
    unique_classes = np.unique(y_test)
    is_multiclass = len(unique_classes) > 2
    
    # 3. Classification Report
    target_names = ['No Diabetes', 'Pre-Diabetes', 'Diabetes'] if is_multiclass else ['Not Diabetic', 'Diabetic']
    class_report = classification_report(
        y_test, 
        y_test_pred, 
        target_names=target_names,
        zero_division=0
    )
    
    # 4. ROC Curve (Multi-class vs Binary)
    if is_multiclass:
        try:
            y_prob = model.predict_proba(X_test)
            if len(y_prob.shape) == 1 or y_prob.shape[1] < 3:
                # If shape mismatch, binarize prediction output as a fallback
                y_prob = label_binarize(y_test_pred, classes=[0, 1, 2])
        except (AttributeError, ValueError):
            y_prob = label_binarize(y_test_pred, classes=[0, 1, 2])
            
        y_test_bin = label_binarize(y_test, classes=[0, 1, 2])
        
        fpr = dict()
        tpr = dict()
        roc_auc_dict = dict()
        
        # Calculate class-wise ROC
        for i in range(3):
            fpr[i], tpr[i], _ = roc_curve(y_test_bin[:, i], y_prob[:, i])
            roc_auc_dict[i] = auc(fpr[i], tpr[i])
            
        # Calculate micro ROC
        fpr["micro"], tpr["micro"], _ = roc_curve(y_test_bin.ravel(), y_prob.ravel())
        roc_auc_dict["micro"] = auc(fpr["micro"], tpr["micro"])
        
        # Calculate macro ROC
        all_fpr = np.unique(np.concatenate([fpr[i] for i in range(3)]))
        mean_tpr = np.zeros_like(all_fpr)
        for i in range(3):
            mean_tpr += np.interp(all_fpr, fpr[i], tpr[i])
        mean_tpr /= 3
        fpr["macro"] = all_fpr
        tpr["macro"] = mean_tpr
        roc_auc_dict["macro"] = auc(fpr["macro"], tpr["macro"])
        roc_auc = roc_auc_dict["macro"]
        
        plt.figure(figsize=(8, 6))
        plt.plot(fpr["micro"], tpr["micro"],
                 label=f'micro-average ROC (AUC = {roc_auc_dict["micro"]:.4f})',
                 color='deeppink', linestyle=':', lw=4)

        plt.plot(fpr["macro"], tpr["macro"],
                 label=f'macro-average ROC (AUC = {roc_auc_dict["macro"]:.4f})',
                 color='navy', linestyle=':', lw=4)

        colors = ['aqua', 'darkorange', 'cornflowerblue']
        for i, color in zip(range(3), colors):
            plt.plot(fpr[i], tpr[i], color=color, lw=2,
                     label=f'ROC of class: {target_names[i]} (AUC = {roc_auc_dict[i]:.4f})')

        plt.plot([0, 1], [0, 1], 'k--', lw=2)
        plt.xlim([0.0, 1.0])
        plt.ylim([0.0, 1.05])
        plt.xlabel('False Positive Rate')
        plt.ylabel('True Positive Rate')
        plt.title(f'Multi-Class ROC Curve - {best_model_name}')
        plt.legend(loc="lower right")
        plt.grid(True, linestyle='--', alpha=0.7)
        plt.tight_layout()
        plt.savefig(roc_path, dpi=150)
        plt.close()
        print(f"ROC Curve saved to {roc_path}")
    else:
        try:
            y_prob = model.predict_proba(X_test)
            if len(y_prob.shape) > 1 and y_prob.shape[1] == 2:
                y_prob = y_prob[:, 1]
        except AttributeError:
            y_prob = model.decision_function(X_test) if hasattr(model, 'decision_function') else y_test_pred
            
        fpr, tpr, thresholds = roc_curve(y_test, y_prob)
        roc_auc = auc(fpr, tpr)
        
        plt.figure(figsize=(8, 6))
        plt.plot(fpr, tpr, color='darkorange', lw=2, label=f'ROC curve (AUC = {roc_auc:.4f})')
        plt.plot([0, 1], [0, 1], color='navy', lw=2, linestyle='--')
        plt.xlim([0.0, 1.0])
        plt.ylim([0.0, 1.05])
        plt.xlabel('False Positive Rate')
        plt.ylabel('True Positive Rate')
        plt.title(f'ROC Curve - {best_model_name}')
        plt.legend(loc="lower right")
        plt.grid(True, linestyle='--', alpha=0.7)
        plt.tight_layout()
        plt.savefig(roc_path, dpi=150)
        plt.close()
        print(f"ROC Curve saved to {roc_path}")
        
    # 5. Feature Importance
    importances = None
    target_estimator = model
    
    # Resolve meta-estimators
    if hasattr(model, 'estimators_'):
        for est in model.estimators_:
            if hasattr(est, 'feature_importances_'):
                target_estimator = est
                break
    elif hasattr(model, 'estimators_') and hasattr(model, 'named_estimators'):
        for name, est in model.named_estimators.items():
            if hasattr(est, 'feature_importances_'):
                target_estimator = est
                break
                
    if hasattr(target_estimator, 'feature_importances_'):
        importances = target_estimator.feature_importances_
        if len(importances) == len(feature_names):
            indices = np.argsort(importances)[::-1]
            
            plt.figure(figsize=(10, 6))
            sns.barplot(
                x=importances[indices], 
                y=[feature_names[i] for i in indices], 
                palette="viridis"
            )
            plt.title(f"Feature Importance Ranking ({target_estimator.__class__.__name__})")
            plt.xlabel("Relative Importance")
            plt.ylabel("Features")
            plt.grid(True, linestyle='--', alpha=0.5, axis='x')
            plt.tight_layout()
            plt.savefig(fi_path, dpi=150)
            plt.close()
            print(f"Feature Importance chart saved to {fi_path}")
        else:
            print("Warning: Feature importance size mismatch. Skipping plot.")
            
    # 6. Confidence Score Testing (10 random test samples)
    rng = np.random.RandomState(42)
    indices = rng.choice(len(X_test), 10, replace=False)
    
    if isinstance(X_test, pd.DataFrame):
        samples_X = X_test.iloc[indices]
    else:
        samples_X = X_test[indices]
        
    if isinstance(y_test, pd.Series):
        samples_y = y_test.iloc[indices].values
    else:
        samples_y = y_test[indices]
        
    sample_preds = model.predict(samples_X)
    try:
        sample_probs = model.predict_proba(samples_X)
    except AttributeError:
        sample_probs = None
        
    confidence_lines = []
    confidence_lines.append(f"{'Sample #':<10} | {'Prediction':<16} | {'Actual Value':<16} | {'Confidence Score':<18} | {'Status':<10}")
    confidence_lines.append("-" * 80)
    for idx, (p, a) in enumerate(zip(sample_preds, samples_y)):
        pred_label = target_names[int(p)]
        actual_label = target_names[int(a)]
        status = "Correct" if int(p) == int(a) else "Incorrect"
        
        if sample_probs is not None:
            if is_multiclass:
                chosen_prob = sample_probs[idx, int(p)]
            else:
                prob = sample_probs[idx]
                if len(prob.shape) > 0 and prob.shape[0] == 2:
                    prob = prob[1]
                chosen_prob = prob if int(p) == 1 else (1.0 - prob)
            prob_score = f"{chosen_prob * 100:.2f}%"
        else:
            prob_score = "N/A"
            
        confidence_lines.append(f"{idx+1:<10} | {pred_label:<16} | {actual_label:<16} | {prob_score:<18} | {status:<10}")
    confidence_report_str = "\n".join(confidence_lines)
    
    # 7. Generalization Check
    diff = train_acc - test_acc
    if diff > 0.08:
        generalization_msg = "Possible Overfitting Detected"
    else:
        generalization_msg = "Model Generalizes Well"
        
    # 8. Comparison Table (Before vs After Optimization)
    comparison_block = ""
    if baseline_metrics is not None and optimized_metrics is not None:
        comparison_block = f"""
3. BEFORE VS AFTER OPTIMIZATION COMPARISON:
--------------------------------------------------
{"Metric":<30} | {"Before (Baseline)":<20} | {"After (Optimized)":<20} | {"Improvement":<15}
{"-" * 93}
{"Test Accuracy":<30} | {baseline_metrics['accuracy']*100:18.2f}% | {optimized_metrics['accuracy']*100:18.2f}% | {((optimized_metrics['accuracy'] - baseline_metrics['accuracy']) * 100):+13.2f}%
{"Test Recall (Macro)":<30} | {baseline_metrics['recall']*100:18.2f}% | {optimized_metrics['recall']*100:18.2f}% | {((optimized_metrics['recall'] - baseline_metrics['recall']) * 100):+13.2f}%
{"Test Precision (Macro)":<30} | {baseline_metrics['precision']*100:18.2f}% | {optimized_metrics['precision']*100:18.2f}% | {((optimized_metrics['precision'] - baseline_metrics['precision']) * 100):+13.2f}%
{"Test F1 Score (Macro)":<30} | {baseline_metrics['f1_score']*100:18.2f}% | {optimized_metrics['f1_score']*100:18.2f}% | {((optimized_metrics['f1_score'] - baseline_metrics['f1_score']) * 100):+13.2f}%
{"Test ROC AUC (Macro)":<30} | {baseline_metrics['roc_auc']:20.4f} | {optimized_metrics['roc_auc']:20.4f} | {(optimized_metrics['roc_auc'] - baseline_metrics['roc_auc']):+14.4f}
"""

    # 9. Comparison Report (Old Pima vs New Dataset)
    pima_comparison_block = ""
    if old_comparison is not None:
        p_acc, p_rec, p_f1 = old_comparison.get('accuracy', 0.7727), old_comparison.get('recall', 0.6296), old_comparison.get('f1_score', 0.6602)
        new_acc = optimized_metrics['accuracy'] if optimized_metrics else test_acc
        new_rec = optimized_metrics['recall'] if optimized_metrics else recall_score(y_test, y_test_pred, average='macro', zero_division=0)
        new_f1 = optimized_metrics['f1_score'] if optimized_metrics else f1_score(y_test, y_test_pred, average='macro', zero_division=0)
        
        pima_comparison_block = f"""
8. COMPARISON WITH OLD PIMA DATASET RESULTS:
--------------------------------------------------
{"Metric":<30} | {"Old Pima Dataset":<20} | {"New BRFSS2015 Dataset":<22} | {"Improvement":<15}
{"-" * 93}
{"Accuracy":<30} | {p_acc*100:18.2f}% | {new_acc*100:20.2f}% | {((new_acc - p_acc) * 100):+13.2f}%
{"Recall":<30} | {p_rec*100:18.2f}% | {new_rec*100:20.2f}% | {((new_rec - p_rec) * 100):+13.2f}%
{"F1 Score":<30} | {p_f1*100:18.2f}% | {new_f1*100:20.2f}% | {((new_f1 - p_f1) * 100):+13.2f}%
"""

    p_val = optimized_metrics['precision'] if optimized_metrics else precision_score(y_test, y_test_pred, average='macro', zero_division=0)
    r_val = optimized_metrics['recall'] if optimized_metrics else recall_score(y_test, y_test_pred, average='macro', zero_division=0)
    f_val = optimized_metrics['f1_score'] if optimized_metrics else f1_score(y_test, y_test_pred, average='macro', zero_division=0)

    # Prepare text report
    report_content = f"""==================================================
DIABETES PREDICTION SYSTEM - DETAILED EVALUATION REPORT
==================================================

Selected Best Model: {best_model_name}

1. ACCURACY & PERFORMANCE METRICS (OPTIMIZED MODEL):
--------------------------------------------------
Training Accuracy: {train_acc * 100:.2f}%
Testing Accuracy:  {test_acc * 100:.2f}%

2. 5-FOLD STRATIFIED CROSS VALIDATION (ON TRAINING DATA):
--------------------------------------------------
Individual Fold Scores: {', '.join([f'{score * 100:.2f}%' for score in cv_scores])}
Mean CV Accuracy:       {mean_cv * 100:.2f}%
Standard Deviation:     {std_cv * 100:.2f}%
{comparison_block}
4. CLASSIFICATION REPORT (ON TESTING DATA):
--------------------------------------------------
{class_report}

5. GENERALIZATION CHECK:
--------------------------------------------------
Train vs Test Difference: {diff * 100:.2f}%
Status: {generalization_msg}

6. CONFIDENCE SCORE TESTING (10 RANDOM TEST SAMPLES):
--------------------------------------------------
{confidence_report_str}

7. FINAL SUMMARY SUMMARY:
--------------------------------------------------
Train Accuracy:             {train_acc * 100:.2f}%
Test Accuracy:              {test_acc * 100:.2f}%
Cross Validation Accuracy:  {mean_cv * 100:.2f}%
Precision (Macro):          {p_val * 100:.2f}%
Recall (Macro):             {r_val * 100:.2f}%
F1 Score (Macro):           {f_val * 100:.2f}%
ROC AUC (Macro):            {roc_auc:.4f}
==================================================
{pima_comparison_block}
==================================================
"""
    
    # Write to file
    with open(report_path, 'w') as f:
        f.write(report_content)
    print(f"Detailed evaluation report written to {report_path}")
    
    # Print to console
    print(report_content)
