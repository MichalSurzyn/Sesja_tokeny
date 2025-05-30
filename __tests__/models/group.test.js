import mongoose from 'mongoose'
import Group from '../../Models/Group.js'
import User from '../../Models/User.js'

beforeEach(async () => {
  await mongoose.connect(process.env.URI || 'mongodb://localhost:27017/test')
  await Group.deleteMany({})
  await User.deleteMany({})
})

afterEach(async () => {
  await mongoose.connection.close()
})

describe('Group Model Test', () => {
  it('should create & save group successfully', async () => {
    // Najpierw tworzymy użytkownika jako ownera grupy
    const user = new User({
      first_name: 'Anna',
      last_name: 'Nowak',
      email: 'anna.nowak@example.com',
      password: 'Password123!',
      role: '0x01',
    })
    const savedUser = await user.save()

    const validGroup = new Group({
      name: 'Test Group',
      description: 'Opis grupy testowej',
      owner: [savedUser._id],
      members: [savedUser._id],
      tasks: [],
    })

    const savedGroup = await validGroup.save()

    expect(savedGroup._id).toBeDefined()
    expect(savedGroup.name).toBe(validGroup.name)
    expect(savedGroup.description).toBe(validGroup.description)
    expect(savedGroup.owner[0].toString()).toBe(savedUser._id.toString())
    expect(savedGroup.members[0].toString()).toBe(savedUser._id.toString())
  })

  it('should fail to save group without required fields', async () => {
    const groupWithoutName = new Group({
      description: 'Brak nazwy',
      owner: [],
    })
    let err

    try {
      await groupWithoutName.save()
    } catch (error) {
      err = error
    }

    expect(err).toBeInstanceOf(mongoose.Error.ValidationError)
    expect(err.errors.name).toBeDefined()
    expect(err.errors.owner).toBeDefined()
  })
})
