from fastapi import FastAPI

app = FastAPI(
    title="Dokit FastAPI Sandbox",
    version="1.0.0"
)

@app.get("/")
def read_root():
    return {
        "status": "success",
        "message": "FastAPI sandbox is running successfully!"
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}