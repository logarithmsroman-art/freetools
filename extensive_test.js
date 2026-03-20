async function testHandle(username) {
  const platforms = [
    'instagram', 'facebook', 'twitter', 'github', 'reddit', 
    'twitch', 'pinterest', 'youtube', 'medium', 'onlyfans'
  ];
  
  console.log(`\n--- Testing Handle: @${username} ---`);
  
  for (const platformId of platforms) {
    try {
      const res = await fetch('http://localhost:3000/api/check-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, platformId })
      });
      const data = await res.json();
      const statusIcon = data.status === 'available' ? '✅' : data.status === 'taken' ? '❌' : '⚠️';
      console.log(`${statusIcon} ${platformId.padEnd(10)}: ${data.status.toUpperCase()} ${data.reason ? `(${data.reason})` : ''} ${data.details ? `[${data.details}]` : ''}`);
    } catch (e) {
      console.log(`❗ ${platformId.padEnd(10)}: ERROR (${e.message})`);
    }
  }
}

async function run() {
  // 1. Nonsense (Likely Available)
  await testHandle('54367778687678');
  await testHandle('random_str_9988776655_xyz');
  
  // 2. Known Taken
  await testHandle('cristiano');
  await testHandle('github');
  
  // 3. Invalid
  await testHandle('a b'); // Spaces
  await testHandle('a');   // Too short
}

run();
