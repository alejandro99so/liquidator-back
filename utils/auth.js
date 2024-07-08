const { Web3 } = require("web3");
const jose = require("jose");

const authUser = async (authorization) => {
  let jwt;
  try {
    jwt = authorization.split(" ")[1];
    if (!jwt) return { error: true, message: "TOKEN_NOT_FOUND" };
  } catch (ex) {
    return { error: true, message: "ERROR_GETTING_TOKEN" };
  }
  let payload;
  try {
    const secret = new TextEncoder().encode(process.env.privateKey);
    const _token = await jose.jwtVerify(jwt, secret);
    payload = _token.payload;
  } catch (ex) {
    if (ex.code == "ERR_JWT_EXPIRED")
      return { error: true, message: "JWT_EXPIRED" };
    return { error: true, message: "ERROR_GETTING_PAYLOAD" };
  }
  if (!payload) return { error: true, message: "PAYLOAD_NOT_FOUND" };
  if (payload.exp < Math.floor(Date.now() / 1000)) {
    return { error: true, message: "TOKEN_EXPIRED" };
  }
  const data = {
    Message: "Connect to Liquidator",
    URI: "www.liquidator.com",
    iat: payload.iat,
    exp: payload.iat + 3600,
  };
  const web3 = new Web3();
  try {
    const signingAddress = web3.eth.accounts.recover(
      JSON.stringify(data),
      payload.signature
    );
    if (payload.address && signingAddress != payload.address) {
      return { error: true, message: "ADDRESS_NOT_SIGNER" };
    }
  } catch (ex) {
    console.log(ex.message);
    return { error: true, message: "ERROR_RECOVERING_MESSAGE_SIGNER" };
  }
  payload.address = payload.address.toLowerCase();
  return { error: false, payload };
};

module.exports = { authUser };
