# salubritas-clinic-pro-backend

🏥**Clinic Management Software (Electronic Medical Records) - Active Development**

A secure, high-performance GraphQL backend engineered for medical professionals to manage patient care and scheduling. This system is built with data integrity and strict privacy controls at its core.

## 🌟 Key Features

* **📅 Smart Appointment Scheduling:** Real-time booking with automated provider availability validation.
* **🔐 Secure Authentication with Firebase:** Built-in mechanisms to keep user authentication and sessions secure.
* **🌍 URL-Based Multi-Tenancy:** Run multiple clinic instances simultaneously. The app isolates data by embedding a clinicId in the URL, allowing staff to securely work in different clinics across multiple browser tabs at the same time.
* **🚫 Role-Based Access Control:** Secure route guards to protect endpoints and restrict unauthorized access.
* **🔒 Strict HIPAA Readiness:** Comprehensive audit logging for data access alongside field-level encryption for PII.


🛠️ **Tech Stack & Architecture**

* **💻 Framework:** NestJS (TypeScript) utilizing Domain-Driven Design (DDD) principles.
* **🌐 API Layer:** GraphQL (Code-First approach) with Apollo Server.
* **💾 Database:** PostgreSQL via Prisma ODM.
* **🛡️ Validation:** Class-validator with custom medical-logic constraints.

😍 **System Design Highlights**

* **⚡ PostgreSQL Optimization:** Utilizes compound indexes on `doctorID` and `appointmentDate` to keep scheduling queries under 10ms.
* **🏗️ NestJS Dependency Injection:** Keeps business logic isolated from database frameworks for easy unit testing.
* **🧼 SQL Database:** For clinical management system to ensure scalability and future data analysis we must use SQL databases.
* E-R diagram: https://dbdiagram.io/d/salubritas-clinic-pro-6a667af7067336e1def90e2b
  

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



