import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// A `main` function so that we can use async/await
async function main() {
  // Seed the database with users and posts
  const user1 = await prisma.user.create({
    data: {
      email: "maverickone@gmail.com",
      name: "Murali Don",
      username: "murali",
      hashedPassword: "",
      salt: "",
      // federatedCredentials: {},
      emailVerified: true,
      todos: {
        create: [
          {
            title: "first",
            completed: true,
          },
          {
            title: "second",
            completed: false,
          },
        ],
      },
    },
  });
  console.log(`Created users: ${user1.name} `);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
