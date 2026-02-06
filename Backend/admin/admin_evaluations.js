import { Router } from 'express'
import db from '../../../db.js'

const router = Router()

// ================= Evaluation =================
router.get('/evaluations/:projectId', async (req, res) => {
  res.set('Cache-Control', 'no-store')
  const { projectId } = req.params

  try {
    const [[row]] = await db.query(`
      SELECT
        pe.*,
        s.scope_name,
        u.user_name AS owner
      FROM plan_evaluations pe
      JOIN scopes s ON pe.scope_id = s.scope_id
      LEFT JOIN users u ON u.user_id = s.coordinator_id
      WHERE pe.project_plan_id = ?
    `, [projectId])

    res.json(row || null)
  } catch (err) {
    console.error('GET evaluation error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})


router.post('/evaluations/:projectId', async (req, res) => {
  const { projectId } = req.params

  const {
    objective,
    beforeImprove,
    expectedAfter,
    actualResult,
    suggestion,
    projectStatus,
    evaluation
  } = req.body

  try {
    const [[plan]] = await db.query(
      `SELECT scope_id FROM project_plans WHERE project_plan_id = ?`,
      [projectId]
    )

    if (!plan) {
      return res.status(404).json({ message: 'Project plan not found' })
    }

    await db.query(
      `
  INSERT INTO plan_evaluations
  (
    project_plan_id,
    scope_id,
    objective,
    before_plan,
    expected_outcome,
    actual_outcome,
    recommendation,
    project_status,
    evaluation_status
  )
  VALUES (?,?,?,?,?,?,?,?,?)
  `,
      [
        projectId,
        plan.scope_id,
        objective,
        beforeImprove,
        expectedAfter,
        actualResult,
        suggestion,
        projectStatus,
        evaluation
      ]
    )

    res.json({ message: 'created' })
  } catch (err) {
    console.error('POST evaluation error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})


router.put('/evaluations/:projectId', async (req, res) => {
  const { projectId } = req.params

  const {
    objective,
    beforeImprove,
    expectedAfter,
    actualResult,
    suggestion,
    projectStatus,
    evaluation
  } = req.body

  try {
    const [[current]] = await db.query(
      `
      SELECT pe.project_status
      FROM plan_evaluations pe
      JOIN project_plans pp ON pe.scope_id = pp.scope_id
      WHERE pp.project_plan_id = ?
      `,
      [projectId]
    )

    if (!current) {
      return res.status(404).json({ message: 'Evaluation not found' })
    }

    if (current.project_status === 'finish') {
      return res.status(403).json({ message: 'Project already closed' })
    }

    await db.query(
      `
      UPDATE plan_evaluations pe
      JOIN project_plans pp ON pe.scope_id = pp.scope_id
      SET
        pe.objective = ?,
        pe.before_plan = ?,
        pe.expected_outcome = ?,
        pe.actual_outcome = ?,
        pe.recommendation = ?,
        pe.project_status = ?,
        pe.evaluation_status = ?
      WHERE pp.project_plan_id = ?
      `,
      [
        objective,
        beforeImprove,
        expectedAfter,
        actualResult,
        suggestion,
        projectStatus,
        evaluation,
        projectId
      ]
    )

    res.json({ message: 'updated' })
  } catch (err) {
    console.error('PUT evaluation error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router