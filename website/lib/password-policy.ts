import {readLimitedText} from './request-body';
export function passwordPolicyError(password:string,email:string):string|null{
 if([...password].length<16||password.length>128)return 'Gunakan kata sandi 16–128 karakter.';
 if(!/[a-z]/.test(password)||!/[A-Z]/.test(password)||!/[0-9]/.test(password)||!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?`~]/.test(password))return 'Sertakan huruf besar, huruf kecil, angka, dan simbol.';
 if(/(.)\1{4}/u.test(password))return 'Hindari karakter yang berulang lima kali atau lebih.';
 const local=email.split('@')[0].toLowerCase();
 if(local.length>=4&&password.toLowerCase().includes(local))return 'Kata sandi tidak boleh mengandung nama pada alamat email.';
 return null;
}
// SHA-1 is used only for HIBP range lookup, never for password storage.
// Only the five-character prefix leaves the server; no password/email/full hash is sent or logged.
export async function isBreachedPassword(password:string):Promise<boolean>{
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-1',new TextEncoder().encode(password))),b=>b.toString(16).padStart(2,'0')).join('').toUpperCase();
 const response=await fetch('https://api.pwnedpasswords.com/range/'+hash.slice(0,5),{headers:{'Add-Padding':'true','User-Agent':'DutaGlobalGroup-PasswordSecurity'},signal:AbortSignal.timeout(8000),redirect:'error',cache:'no-store'});
 if(!response.ok)throw new Error('Password screening unavailable');
 const text=await readLimitedText(response,1024*1024),lines=text.trim().split(/\r?\n/);
 if(!lines.length||lines.some(line=>!/^([A-F0-9]{35}):([0-9]+)$/i.test(line)))throw new Error('Invalid screening response');
 return lines.some(line=>{const [suffix,count]=line.split(':');return suffix.toUpperCase()===hash.slice(5)&&Number(count)>0});
}
