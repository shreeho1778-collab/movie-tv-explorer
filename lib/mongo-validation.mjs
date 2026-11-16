const nonemptyString = { bsonType: 'string', minLength: 1 };
const roles = ['admin', 'user'];
const movieId = { bsonType: ['int', 'long'], minimum: 1 };

const schemas = {
  users: {
    required: ['name', 'email', 'passwordHash', 'role', 'createdAt'],
    properties: {
      name: nonemptyString,
      email: nonemptyString,
      passwordHash: nonemptyString,
      role: { enum: roles },
      watchlist: { bsonType: 'array', items: movieId },
      createdAt: { bsonType: 'date' },
    },
  },
  reviews: {
    required: ['movieId', 'userId', 'userName', 'score', 'text', 'createdAt'],
    properties: {
      movieId,
      userId: nonemptyString,
      userName: nonemptyString,
      score: { bsonType: ['int', 'long'], minimum: 1, maximum: 10 },
      text: { bsonType: 'string', minLength: 5 },
      tags: { bsonType: 'array', items: nonemptyString },
      spoiler: { bsonType: 'bool' },
      createdAt: { bsonType: 'date' },
    },
  },
  activity_logs: {
    required: ['action', 'createdAt'],
    properties: {
      userId: { bsonType: ['string', 'null'] },
      userName: nonemptyString,
      role: { enum: [...roles, null] },
      action: nonemptyString,
      details: { bsonType: 'object' },
      createdAt: { bsonType: 'date' },
    },
  },
};

export async function ensureCollectionValidation(db) {
  for (const [name, schema] of Object.entries(schemas)) {
    const options = {
      validator: { $jsonSchema: { bsonType: 'object', ...schema } },
      validationLevel: 'strict',
      validationAction: 'error',
    };

    try {
      await db.createCollection(name, options);
    } catch (error) {
      if (error.code !== 48) throw error; // NamespaceExists
      await db.command({ collMod: name, ...options });
    }
  }
}
