require('dotenv').config()

const { ApolloServer } = require('@apollo/server')
const { startStandaloneServer } = require('@apollo/server/standalone');
const { GraphQLError } = require("graphql");
const { ObjectId } = require('mongodb')

const { connect, getDB } = require('./config/config');

const typeDefs = `#graphql
  interface Book {
    title: String
    author: String
  }

  input BookInput {
    title: String
    author: String
  }

  type BookMongoDbResponse implements Book {
    _id: ID
    title: String
    author: String
  }

  type Query {
    books: [BookMongoDbResponse]
  }

  type BookDeleteResponse {
    message: String
  }

  type Mutation {
    addBook(title: String, author: String): BookMongoDbResponse
    deleteBook(id: String): BookDeleteResponse
    updateBook(id: String, input: BookInput): BookMongoDbResponse
  }
`

const resolvers = {
  Query: {
    books: async (_, __, contextValue) => {
      const db = contextValue.db
      const result = await db.collection('books').find({}).toArray()
      // console.log(result[0]["_id"])
      return result
    }
  },
  Mutation: {
    addBook: async (_, args, contextValue) => {
      console.log(args)
      const { title, author } = args
      const { db } = contextValue

      const newBook = {
        title,
        author
      }

      const result = await db.collection("books").insertOne(newBook)
      console.log(result)
      const resultId = result['insertedId'] // new ObjectId("fghhbkjbn")

      const query = {
        "_id": resultId
      }

      const foundBook = await db.collection("books").findOne(query)

      return foundBook
    },
    deleteBook: async (_, args, contextValue) => {
      console.log(args)
      const { id } = args
      const { db } = contextValue

      const query = {
        "_id": new ObjectId(id)
      }
      await db.collection('books').deleteOne(query)

      return { message: `Book with id: ${id} has been deleted`}
    },
    updateBook: async (_, args, contextValue) => {
      console.log(args)
      const { db } = contextValue
      const{ id } = args
      // const { title, author } = args['input']

      const objectId = new ObjectId(id)

      const filter = {
        "_id": objectId
      }

      const updateBook = {
        $set: {
          ...args['input']
        }
      }

      await db.collection('books').updateOne(filter, updateBook)
      const foundBook = await db.collection('books').findOne({ "_id": objectId})

      return foundBook
    }
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

(async () => {
  // ? Connect to MongoDB
  await connect();
  const db = await getDB();

  const { url } = await startStandaloneServer(server, {
    listen: 4000,
    context: async ({ req, res }) => {
      console.log("this console will be triggered on every request");
      // Always return an object
      return {
        // We can make the global function definition inside here
        dummyFunction: () => {
          console.log("We can read headers here", req.headers);
          // Let's make it error
          throw new GraphQLError("This is an error", {
            // This is the extension for the error (to show in the response)
            extensions: {
              // https://www.apollographql.com/docs/apollo-server/data/errors#built-in-error-codes
              // https://www.apollographql.com/docs/apollo-server/data/errors#custom-errors
              code: "INTERNAL_SERVER_ERROR",
            },
          });
        },

        // Use db as the contextValue
        db,
      };
    },
  });

  console.log(`🚀 Server ready at ${url}`);
})();