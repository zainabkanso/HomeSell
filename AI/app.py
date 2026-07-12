from pathlib import Path
import pickle

import pandas as pd
from flask import Flask, jsonify, render_template, request
from flask_cors import CORS


BASE_DIR = Path(__file__).resolve().parent

app = Flask(
    __name__,
    template_folder=str(BASE_DIR / "templates"),
)

CORS(app)


MODEL_PATH = BASE_DIR / "random_forest_model.pkl"
ENCODERS_PATH = BASE_DIR / "label_encoders.pkl"
COLUMNS_PATH = BASE_DIR / "x_columns.pkl"

try:
    with MODEL_PATH.open("rb") as model_file:
        model = pickle.load(model_file)

    with ENCODERS_PATH.open("rb") as encoders_file:
        encoders = pickle.load(encoders_file)

    with COLUMNS_PATH.open("rb") as columns_file:
        columns = pickle.load(columns_file)

    print("Model and preprocessing files loaded successfully.")

except Exception as error:
    print(f"Failed to load model files: {error}")
    raise


@app.route("/", methods=["GET"])
def home():
    return render_template("index.html")


@app.route("/health", methods=["GET"])
def health():
    return jsonify(
        {
            "status": "ok",
            "service": "HomeSell house-price prediction API",
        }
    )


@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json(silent=True)

        if not data or not isinstance(data, dict):
            return (
                jsonify(
                    {
                        "message": "A valid JSON object is required.",
                    }
                ),
                400,
            )

        dataframe = pd.DataFrame([data])

        for column_name in dataframe.columns:
            dataframe[column_name] = pd.to_numeric(
                dataframe[column_name],
                errors="ignore",
            )

        categorical_columns = [
            "Location",
            "Type",
            "Condition",
        ]

        for column_name in categorical_columns:
            if column_name not in dataframe.columns:
                continue

            if column_name not in encoders:
                return (
                    jsonify(
                        {
                            "message": (
                                f"No encoder was found for {column_name}."
                            ),
                        }
                    ),
                    500,
                )

            encoder = encoders[column_name]
            value = str(dataframe.at[0, column_name])

            if value not in encoder.classes_:
                value = str(encoder.classes_[0])

            dataframe[column_name] = encoder.transform([value])

        for expected_column in columns:
            if expected_column not in dataframe.columns:
                dataframe[expected_column] = 0

        dataframe = dataframe[columns]

        predicted_price = float(model.predict(dataframe)[0])

        return jsonify(
            {
                "price": round(predicted_price, 2),
            }
        )

    except Exception as error:
        print(f"PREDICTION ERROR: {error}")

        return (
            jsonify(
                {
                    "message": "Prediction failed.",
                    "error": str(error),
                }
            ),
            500,
        )


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5001,
        debug=False,
    )
