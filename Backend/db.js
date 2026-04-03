import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
dotenv.config()

console.log('🔥 DB.JS LOADED')
console.log('DB_HOST =', process.env.DB_HOST)
console.log('DB_PORT =', process.env.DB_PORT)
console.log('DB_USER =', process.env.DB_USER)
console.log('DB_NAME =', process.env.DB_NAME)

const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
})

db.getConnection()
  .then(conn => {
    console.log('✅ Database connected successfully')
    conn.release()
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message)
  })

export default db