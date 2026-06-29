const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

const NEW_TOKEN = 'EAAWq1TyjUS4BR3CfoB1vXrxbxKeJKcT7iZAczo0Xyp0etpIppMTo1EsZBcB7O9FrgKZCs3nzZBB8sIA1Xm3fzxiPC1N4VQdJLuVlGpkwLmQ1PrfbpZAxJjVVtxFZApbt33a1GDjrbxwvx0rW7XXmRVlzZBwyP3p5mkK0S6kohfoghw5OyMQJUbk57HhsVZCZAmKlNIyFt492PrWngaacsXJ60Gbl3V48hY54lgPFDKh4ciQZBZBYnPwZC2F1D9OWXIj8Vu4WfAnZCXq20DltPFhL1o0PkQjaU';
const N8N_KEY = 'CuWh7KbdAXa1zDpUtFYfSIMRmvJicNnr';

function n8nEncrypt(plaintext, password) {
  const salt = crypto.randomBytes(8);
  function evp(p, s, kl, il) {
    const pk = Buffer.from(p); let d = Buffer.alloc(0), b = Buffer.alloc(0);
    while (d.length < kl + il) { const h = crypto.createHash('md5'); h.update(b); h.update(pk); h.update(s); b = h.digest(); d = Buffer.concat([d, b]); }
    return { key: d.slice(0, kl), iv: d.slice(kl, kl + il) };
  }
  const { key, iv } = evp(password, salt, 32, 16);
  const c = crypto.createCipheriv('aes-256-cbc', key, iv);
  const enc = Buffer.concat([c.update(Buffer.from(plaintext)), c.final()]);
  return Buffer.concat([Buffer.from('Salted__'), salt, enc]).toString('base64');
}

async function main() {
  const credData = JSON.stringify({ name: 'Authorization', value: `Bearer ${NEW_TOKEN}` });
  const encrypted = n8nEncrypt(credData, N8N_KEY);
  const r = await prisma.$executeRawUnsafe(`UPDATE n8n."credentials_entity" SET data = '${encrypted}', "updatedAt" = NOW() WHERE id = '72a20facbfd6437e'`);
  console.log(`✅ Credential n8n mise à jour (${r} row)`);
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e.message); prisma.$disconnect(); });
