const Pool = require('pg').Pool
const pool = new Pool({
  user: 'endtknkxxbolwi',
  host: 'ec2-54-209-221-231.compute-1.amazonaws.com',
  database: 'db7hfalti2riu3',
  password: '14514543dbfb7e1b0a926e78bd03b78838eb466d4ea89ae03b4d7c02af5e9bb4',
  port: 5432,
})

const geterporders = (request, response) => {
  pool.query('SELECT * FROM erporder ORDER BY id ASC', (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).json(results.rows)
  })
}

const geterpordersById = (request, response) => {
  const id = parseInt(request.params.id)

  pool.query('SELECT * FROM users WHERE id = $1', [id], (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).json(results.rows)
  })
}

const createerporders = (request, response) => {
  const { name, email } = request.body

  pool.query('INSERT INTO users (name, email) VALUES ($1, $2)', [name, email], (error, results) => {
    if (error) {
      throw error
    }
    response.status(201).send(`User added with ID: ${result.insertId}`)
  })
}

const updateerporders = (request, response) => {
  const id = parseInt(request.params.id)
  const { name, email } = request.body

  pool.query(
    'UPDATE users SET name = $1, email = $2 WHERE id = $3',
    [name, email, id],
    (error, results) => {
      if (error) {
        throw error
      }
      response.status(200).send(`User modified with ID: ${id}`)
    }
  )
}

const deleteerporders = (request, response) => {
  const id = parseInt(request.params.id)

  pool.query('DELETE FROM users WHERE id = $1', [id], (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).send(`User deleted with ID: ${id}`)
  })
}

module.exports = {
  geterporders,
  geterpordersById,
  createerporders,
  updateerporders,
  deleteerporders,
}
