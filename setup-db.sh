#!/bin/bash

echo "🚀 Starting PostgreSQL Database Setup..."

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker first:"
    echo "   https://docs.docker.com/get-docker/"
    exit 1
fi

# Start PostgreSQL container
echo "🐳 Starting PostgreSQL container..."
docker-compose up -d

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

# Check if PostgreSQL is ready
until docker exec myobt-postgres pg_isready -U myobt_user -d myobt_complaints; do
    echo "⏳ Waiting for database..."
    sleep 2
done

echo "✅ PostgreSQL is ready!"

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run database migration
echo "📊 Running database migration..."
npx prisma migrate dev --name init || echo "Migration might already exist"

# Seed the database
echo "🌱 Seeding database with sample data..."
npx prisma db seed

echo "🎉 Database setup complete!"
echo ""
echo "📋 Connection Info:"
echo "   Host: localhost"
echo "   Port: 5432"
echo "   Database: myobt_complaints"
echo "   User: myobt_user"
echo "   Password: myobt_password"
echo ""
echo "🚀 You can now start the application:"
echo "   npm run dev"
