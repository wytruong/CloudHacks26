// App.jsx — simplified flow
const [showFaceVerify, setShowFaceVerify] = useState(false);
const [eventId, setEventId] = useState(null);

// On login attempt, call your security backend
async function handleLogin(username, password) {
  // Your existing Bedrock risk-score call happens here
  const riskScore = await getRiskScore(username); // your existing flow
  
  if (riskScore >= 41 && riskScore <= 90) {
    // Yellow flag — trigger face verify
    const { eventId } = await createRiskEvent(username, riskScore);
    setEventId(eventId);
    setShowFaceVerify(true); // pops the camera modal
  } else if (riskScore > 90) {
    // Red flag — block immediately
    alert('Login blocked. Contact support.');
  } else {
    // Green — proceed
    navigate('/home');
  }
}