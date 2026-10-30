import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import assert from 'node:assert/strict';

const execute = promisify(execFile);
const sdk = process.env.ANDROID_HOME || path.join(process.env.LOCALAPPDATA, 'Android/Sdk');
const jdkTool = name => process.env.JAVA_HOME ? path.join(process.env.JAVA_HOME, 'bin', name + '.exe') : name;
const run = async (name, args) => (await execute(name, args, { timeout: 120000, maxBuffer: 16 * 1024 * 1024 })).stdout;
const apk = path.resolve('releases/Eldervale-Android-v1.6.0.apk');
const aab = path.resolve('releases/Eldervale-Play-v1.6.0.aab');
const checks = [];
const check = (label, condition) => { assert(condition, label); checks.push(label); console.log('PASS ' + label); };

const signature = await run(jdkTool('java'), ['-jar', path.join(sdk, 'build-tools/36.0.0/lib/apksigner.jar'), 'verify', '--verbose', apk]);
check('Release APK signature verifies with APK Signature Scheme v2', /Verified using v2 scheme.*true/.test(signature));
const bundleSignature = await run(jdkTool('jarsigner'), ['-verify', aab]);
check('Play AAB signature verifies', /jar verified/.test(bundleSignature));
const badging = await run(path.join(sdk, 'build-tools/36.0.0/aapt.exe'), ['dump', 'badging', apk]);
check('Release package has the expected app ID and version', /name='com\.eldervale\.hollowsun'.*versionCode='8'.*versionName='1\.6\.0'/.test(badging));
check('Release targets API 36 with minimum API 24', /sdkVersion:'24'/.test(badging) && /targetSdkVersion:'36'/.test(badging));
const manifest = await run(path.join(sdk, 'build-tools/36.0.0/aapt.exe'), ['dump', 'xmltree', apk, 'AndroidManifest.xml']);
check('Release activity requests portrait orientation', /screenOrientation.*0x1/.test(manifest));
check('Release includes AdMob test configuration and Play Billing',/com.google.android.gms.ads.APPLICATION_ID/.test(manifest)&&/com.android.vending.BILLING/.test(manifest));
const entries = (await run(jdkTool('jar'), ['tf', aab])).split(/\r?\n/);
check('AAB includes all 24 nature and Foley WAV files', entries.filter(e => /\.wav$/.test(e)).length === 24);
check('AAB includes the reusable furniture atlas and provenance', entries.some(e=>e.endsWith('/assets/pack/furniture.png'))&&entries.some(e=>e.endsWith('/assets/audio/sound-manifest.json')));
check('AAB includes the four generated reusable world landmarks',entries.some(e=>e.endsWith('/assets/art/world-landmarks-v1.png'))&&entries.some(e=>e.endsWith('/assets/art/world-landmarks-v1.json')));
check('AAB excludes instrumental files and private signing files', !entries.some(e => /\.jks$|signing\.properties$/.test(e)||e.endsWith('.mp3')&&!e.includes('/assets/audio/voice/')));
check('AAB includes all 75 offline ElevenLabs performances and four cinematic scenes',entries.filter(e=>e.includes('/assets/audio/voice/')&&e.endsWith('.mp3')).length===75&&[0,1,2,3].every(i=>entries.some(e=>e.endsWith('/assets/art/story-'+i+'.webp'))));
check('AAB has no native shared libraries requiring page alignment', !entries.some(e => /\.so$/.test(e)));
const scripts = (await readdir('dist/assets')).filter(e => e.endsWith('.js'));
check('Production JavaScript excludes API credentials', !(await Promise.all(scripts.map(name=>readFile('dist/assets/'+name,'utf8')))).some(s=>/sk_[a-f0-9]{40,}|xi-api-key|ELEVENLABS_API_KEY/.test(s)));
check('Production JavaScript excludes the QA hook', !(await Promise.all(scripts.map(name => readFile('dist/assets/' + name, 'utf8')))).some(s => s.includes('__eldervaleQA')));

const files = [];
for (const filename of [apk, aab]) {
  const data = await readFile(filename);
  files.push({ file: path.basename(filename), bytes: data.length, sha256: createHash('sha256').update(data).digest('hex') });
}
await writeFile('releases/android-release-manifest.json', JSON.stringify({ version: '1.6.0', versionCode: 8, appId: 'com.eldervale.hollowsun',monetization:'Google test ads; live purchase product requires Play Console configuration',files }, null, 2));
await writeFile('test-results/android-release-report.json', JSON.stringify({ checks, files }, null, 2));
console.log(checks.length + ' release checks passed.');
