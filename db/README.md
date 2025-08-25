Database: MongoDB

Collections:
- users: { username, passwordHash }
- messages: { sender, receiver, ciphertext, iv, authTag, createdAt }
- sessionkeys: { participants[], keyHex, protocol, expiresAt, eveDetected, qber }

Run locally:
1) Install MongoDB Community or use Docker.
2) Default URI: mongodb://127.0.0.1:27017/quantum_chat


