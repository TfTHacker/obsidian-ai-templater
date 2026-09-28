// Encryption helpers for storing API keys at rest. Uses the Web Crypto API:
// PBKDF2-SHA256 to derive an AES-GCM key from a user password, then AES-GCM
// to encrypt. The persisted blob format is versioned:
//   enc:v1:<base64 salt>:<base64 iv>:<base64 ciphertext>
// salt and iv are generated fresh on every encryption.

const BLOB_PREFIX = "enc:v1:";
const PBKDF2_ITERATIONS = 210_000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

export const isEncrypted = (value: string): boolean =>
	value.startsWith(BLOB_PREFIX);

export const toBase64 = (bytes: Uint8Array): string => {
	let binary = "";
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary);
};

export const fromBase64 = (value: string): Uint8Array => {
	const binary = atob(value);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return bytes;
};

const randomBytes = (length: number): Uint8Array =>
	crypto.getRandomValues(new Uint8Array(length));

// derives an AES-GCM 256 key from the password and a per-blob salt
export const deriveKey = async (
	password: string,
	salt: Uint8Array,
): Promise<CryptoKey> => {
	const keyMaterial = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(password),
		"PBKDF2",
		false,
		["deriveKey"],
	);
	return crypto.subtle.deriveKey(
		{
			name: "PBKDF2",
			salt: salt as BufferSource,
			iterations: PBKDF2_ITERATIONS,
			hash: "SHA-256",
		},
		keyMaterial,
		{ name: "AES-GCM", length: 256 },
		false,
		["encrypt", "decrypt"],
	);
};

export const encrypt = async (
	plaintext: string,
	key: CryptoKey,
): Promise<string> => {
	const iv = randomBytes(IV_LENGTH);
	const ciphertext = new Uint8Array(
		await crypto.subtle.encrypt(
			{ name: "AES-GCM", iv: iv as BufferSource },
			key,
			new TextEncoder().encode(plaintext),
		),
	);
	// the salt is not needed to decrypt with a session key, but it is stored
	// so the format stays self-describing for future migrations (v2 with
	// password-derived storage would reuse it)
	const salt = randomBytes(SALT_LENGTH);
	return `${BLOB_PREFIX}${toBase64(salt)}:${toBase64(iv)}:${toBase64(ciphertext)}`;
};

export const decrypt = async (
	blob: string,
	key: CryptoKey,
): Promise<string> => {
	if (!isEncrypted(blob)) {
		throw new Error("Value is not an encrypted blob");
	}
	const parts = blob.slice(BLOB_PREFIX.length).split(":");
	if (parts.length !== 3) {
		throw new Error("Malformed encrypted blob");
	}
	const [, iv, ciphertext] = parts;
	const plaintext = await crypto.subtle.decrypt(
		{ name: "AES-GCM", iv: fromBase64(iv) as BufferSource },
		key,
		fromBase64(ciphertext) as BufferSource,
	);
	return new TextDecoder().decode(plaintext);
};
