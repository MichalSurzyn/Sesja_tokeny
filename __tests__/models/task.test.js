import mongoose from 'mongoose'
import Task from '../../Models/Tasks.js'
import User from '../../Models/User.js'

// Przed każdym testem
beforeEach(async () => {
  await mongoose.connect(process.env.URI || 'mongodb://localhost:27017/test')
  await Task.deleteMany({})
  await User.deleteMany({})
})

// Po każdym teście
afterEach(async () => {
  await mongoose.connection.close()
})

describe('Task Model Test', () => {
  // Test 1: Tworzenie zadania z poprawnymi danymi
  it('should create & save task successfully', async () => {
    // Najpierw tworzymy użytkownika, który będzie właścicielem zadania
    const user = new User({
      first_name: 'Johne',
      last_name: 'Doee',
      email: 'johne.doe@example.com',
      password: 'Password1234!',
    })
    const savedUser = await user.save()

    const validTask = new Task({
      name: 'Test Task1',
      description: 'This is a test task1',
      status: 'do zrobienia1',
      owner: savedUser._id,
    })

    const savedTask = await validTask.save()

    expect(savedTask._id).toBeDefined()
    expect(savedTask.name).toBe(validTask.name)
    expect(savedTask.description).toBe(validTask.description)
    expect(savedTask.status).toBe(validTask.status)
    expect(savedTask.owner.toString()).toBe(savedUser._id.toString())
  })

  // Test 2: Walidacja wymaganych pól
  it('should fail to save task without required fields', async () => {
    const taskWithoutRequiredField = new Task({
      description: 'Test description',
    })
    let err

    try {
      await taskWithoutRequiredField.save()
    } catch (error) {
      err = error
    }

    expect(err).toBeInstanceOf(mongoose.Error.ValidationError)
    expect(err.errors.name).toBeDefined()
    expect(err.errors.owner).toBeDefined()
  })

  // Test 3: Walidacja statusu zadania
  it('should only accept valid task statuses', async () => {
    const user = new User({
      first_name: 'Johne',
      last_name: 'Doee',
      email: 'johne.doe@example.com',
      password: 'Password1234!',
    })
    const savedUser = await user.save()

    const taskWithInvalidStatus = new Task({
      name: 'Test Task1',
      description: 'This is a test task1',
      status: 'invalid_status',
      owner: savedUser._id,
    })

    let err
    try {
      await taskWithInvalidStatus.save()
    } catch (error) {
      err = error
    }

    expect(err).toBeInstanceOf(mongoose.Error.ValidationError)
    expect(err.errors.status).toBeDefined()
  })
})
