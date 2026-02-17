import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
dotenv.config()

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'migration_plan',
  waitForConnections: true,
  connectionLimit: 10
})

export default db