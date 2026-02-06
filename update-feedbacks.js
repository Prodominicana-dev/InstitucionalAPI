// Script temporal para actualizar feedbacks aprobados sin serviceType
const axios = require('axios');

const API_URL = 'http://localhost:3001/apiv2';

async function updateApprovedFeedbacks() {
  try {
    // Actualizar todos los feedbacks aprobados sin serviceType a "investment"
    // console.log('Actualizando feedbacks aprobados a serviceType: investment...');
    const responseInvestment = await axios.patch(
      `${API_URL}/feedback/admin/batch-update-approved`,
      { serviceType: 'investment' }
    );
    // console.log('✅ Feedbacks actualizados:', responseInvestment.data);

    // Verificar los feedbacks públicos de investment
    const publicInvestment = await axios.get(
      `${API_URL}/feedback/public?serviceType=investment`
    );
    // console.log('\n📊 Feedbacks públicos de INVESTMENT:', publicInvestment.data.length);
    publicInvestment.data.forEach(fb => {
      // console.log(`  - ${fb.name}: ${fb.message.substring(0, 50)}...`);
    });

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

updateApprovedFeedbacks();
