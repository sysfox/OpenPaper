// 集中读取签名密钥：缺失或过短直接抛错，拒绝启动，避免使用默认弱密钥
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("缺少环境变量 JWT_SECRET，拒绝启动");
  }
  if (secret.length < 32) {
    throw new Error("环境变量 JWT_SECRET 长度不足，至少需要32个字符");
  }
  return secret;
}
