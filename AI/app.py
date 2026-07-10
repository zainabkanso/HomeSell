from flask import Flask, request, jsonify, render_template
import pickle
import pandas as pd

app = Flask(__name__)

# Load model and encoders
model = pickle.load(open('random_forest_model.pkl', 'rb'))
encoders = pickle.load(open('label_encoders.pkl', 'rb'))  # Ensure this is a dictionary
columns = pickle.load(open('x_columns.pkl', 'rb'))

@app.route('/')
def home():
    return render_template('page.html')

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()  # Get JSON data from front-end
    df = pd.DataFrame([data])  # Convert data into DataFrame

    # Convert numeric values
    for col in df.columns:
        try:
            df[col] = pd.to_numeric(df[col])  # Convert columns to numeric if possible
        except ValueError:
            pass  # Ignore error for non-numeric columns

    # Encode categorical variables (make sure the encoders exist in the dictionary)
    for col in ['Location', 'Type', 'Condition']:
        if col in df.columns:
            le = encoders[col]  # Get the LabelEncoder for that column
            val = df[col][0]
            if val not in le.classes_:  # If unseen label, use the default category
                val = le.classes_[0]
            df[col] = le.transform([val])  # Apply the transformation

    # Ensure all columns are present (add missing columns with a default value of 0)
    for col in columns:
        if col not in df.columns:
            df[col] = 0

    # Align the DataFrame with the expected columns for the model
    df = df[columns]

    # Predict the price using the model
    price = model.predict(df)[0]

    return jsonify({'price': round(price, 2)})  # Return predicted price as JSON

if __name__ == '__main__':
  app.run(debug=True, port=5001)
