# salubritas-clinic-pro-backend

🏥**Clinic Management Software (Electronic Medical Records) - In Progress**

A secure, high-performance GraphQL backend engineered for medical professionals to manage patient care, scheduling, and clinical workflows. This system is built with data integrity and strict privacy controls at its core.

## 🌟 Key Features

* **📅 Smart Appointment Scheduling:** Real-time booking with automated provider availability validation.
* **📑 Electronic Medical Records (EMR):** Encrypted patient histories, timelines, and clinical notes.
* **🩺 ICD-11 Diagnostic Coding:** Native search integration for standardized international medical classification.
* **💊 Prescription & Lab Management:** Digital prescription engines and lab/X-ray test tracking.
* **🔒 Strict HIPAA Readiness:** Audit logging for every data access and field-level encryption for PII.


🛠️ **Tech Stack & Architecture**

* **💻 Framework:** NestJS (TypeScript) utilizing Domain-Driven Design (DDD) principles.
* **🌐 API Layer:** GraphQL (Code-First approach) with Apollo Server.
* **💾 Database:** MongoDB via Mongoose ODM.
* **🛡️ Validation:** Class-validator with custom medical-logic constraints.

😍 **System Design Highlights**

* **⚡ MongoDB Optimization:** Utilizes compound indexes on `doctorID` and `appointmentDate` to keep scheduling queries under 10ms.
* **🏗️ NestJS Dependency Injection:** Keeps business logic isolated from database frameworks for easy unit testing.
* **🧼 Data Sanitization:** Strict Mongoose schemas prevent NoSQL injection vectors.

⚡**Quick Start**

**Prerequisites**
Node.js (v22+) and MongoDB instance running locally or on Atlas.

## ⚡ Quick Start

### 📋 Prerequisites
* **Node.js** (v20 or higher)
* **MongoDB** instance running locally or via MongoDB Atlas

### ⚙️ Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com
   cd salubritas clinic pro
   ```

2. **Configure environment variables:**
   ```bash
   cp .env
   ```
   *Open the newly created `.env` file and add your `MONGO_URI` and `FIREBASE_KEY`.*

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Start the application:**
   ```bash
   npm run start:dev
   ```

5. **Verify the installation:**
   *Open your browser and navigate to `http://localhost:3000/graphql` to explore the interactive GraphQL Playground.*



