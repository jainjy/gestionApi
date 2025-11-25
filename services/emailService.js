const sendInvestmentConfirmationEmail = async ({ to, nom, paysInteret, typeInvestissement, budget, message }) => {
  console.log('📧 [EMAIL SERVICE] Envoi email à:', to);
  console.log('📋 Détails de la demande:');
  console.log('   👤 Nom:', nom);
  console.log('   🌍 Pays:', paysInteret);
  console.log('   🏢 Type:', typeInvestissement);
  console.log('   💰 Budget:', budget);
  console.log('   💬 Message:', message);
  
  return true;
};

module.exports = { sendInvestmentConfirmationEmail };