import mongoose from 'mongoose'

const GroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
    },
  ],
  owner: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
      },
    ],
    required: true,
    validate: {
      validator: function (value) {
        return Array.isArray(value) && value.length > 0
      },
      message: 'At least one owner is required.',
    },
  },
  tasks: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'tasks',
    },
  ],
})

export default mongoose.model('groups', GroupSchema)
