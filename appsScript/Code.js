/* ideally all operations requiring multiple reads should just read the entire sheet
sheet structure:
columns: users (callee)
column:
username
state
offer
answer
offer side ice
answer side ice

the process starts with a callee who creates an offer for a caller to use and start the rtc exchange, each client will continuously ping until the process is finished


for now:
any client will make periodic pings, where each time the long running request ends, the client must re ping 
each ping will come with a next action and drive the "state machine"

TODO:
add cleanup function that clears user data and resets state
on the xfishtank client side, periodically refresh the rtc offer 
maybe if things get crazy, it can become a proper full mesh so comms dont have to go through this slow ahh server
*/
const router = newPostRouter(
  // consider making a get router
  route("/echo", data => {return data}),
  route("/state", state),
  route("/createUser", createUser),
)

function doPost(e) {
  return router.listen(e);
}

const USER_IDX = 0
const STATE_IDX = 1
const OFFER_IDX = 2
const ANSWER_IDX = 3
const OFFER_ICE_IDX = 4
const ANSWER_ICE_IDX = 5
const USER_DATA_LEN = 6

function createUser(data) {
  if (readRange("Users","1:1").map(c=>c[0]).includes(data.username)) {return "ERROR User already exists"}
  const userCol = colNumberToLetter(getLastColumn("Users"))
  writeCells("Users", userCol+(USER_IDX+1)+":"+userCol+(USER_DATA_LEN), [data.username,"START","{}","{}","[]","[]"])
  return "OK"
}

/*
States:
only one client may make state changes at a time, should go something like this
callee sets state to DEAD
DEAD
callee moves from DEAD to OFFER
caller waits for callee to move to OFFER
OFFER
caller makes response, moves from OFFER to RESPONSE
callee waits for caller to move to RESPONSE
RESPONSE
callee gets response, moves from RESPONSE to DEAD

State Transistion Actions:
calleeStart: moves from unknown state to DEAD
calleeOffer: moves from DEAD to OFFER
callerResponse: moves from OFFER to RESPONSE
calleeOK: moves from RESPONSE to DEAD
*/
function state(data) {
  const userColNum = readRange("Users","1:1").map(c=>c[0]).indexOf(data.username)
  if (userColNum < 0) {return {returnMessage:"ERROR User doesnt exist"}}
  const userCol = colNumberToLetter(userColNum);
  let userData = readCol("Users",userCol)
  switch (data.action) {
    case "calleeStart":
      userData[STATE_IDX] = "START"
      userData[OFFER_IDX] = "{}"
      userData[ANSWER_IDX] = "{}"
      userData[OFFER_ICE_IDX] = "[]"
      userData[ANSWER_ICE_IDX] = "[]"
      break
    case "calleeOffer": 
      userData[STATE_IDX] = "OFFER"
      userData[OFFER_IDX] = data.data.offer
      userData[ANSWER_IDX] = userData[ANSWER_IDX]
      userData[OFFER_ICE_IDX] = data.data.offerICE
      userData[ANSWER_ICE_IDX] = userData[ANSWER_ICE_IDX]
      break
    case "callerAnswer":
      userData[STATE_IDX] = "ANSWER"
      userData[OFFER_IDX] = userData[OFFER_IDX]
      userData[ANSWER_IDX] = data.data.answer
      userData[OFFER_ICE_IDX] = userData[OFFER_ICE_IDX]
      userData[ANSWER_ICE_IDX] = data.data.answerICE
      break
    case "calleeOK":
      userData[STATE_IDX] = "DONE"
      userData[OFFER_IDX] = "{}"
      userData[ANSWER_IDX] = "{}"
      userData[OFFER_ICE_IDX] = "[]"
      userData[ANSWER_ICE_IDX] = "[]"
      break
  }
  const msg = writeCells("Users",userCol+(USER_IDX+1)+":"+userCol+(USER_DATA_LEN),userData)
  return {returnMessage:msg,username:userData[USER_IDX], lastAction:data.action, state:userData[STATE_IDX], offer:userData[OFFER_IDX], offerICE:userData[OFFER_ICE_IDX], answer:userData[ANSWER_IDX], answerICE:userData[ANSWER_ICE_IDX]}
}

// Debug tester
function tester() {
  console.log(createUser({username:"test"}))
}