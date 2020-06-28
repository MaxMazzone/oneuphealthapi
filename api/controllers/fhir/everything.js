const axios = require('axios');

module.exports = {


  friendlyName: 'Everything',


  description: 'Everything fhir.',


  inputs: {
    accessToken: {
      type: 'string',
      example: '1b288ss',
      description: 'User Oauth access token to allow access to test patient info',
      required: true,
    },
    skip: {
      type: 'string',
      example: '10',
      description: 'number of entries to skip',
    }
  },


  exits: {
    generalServerError: {
      responseType: 'serverError',
      description: 'General server error',
    },
  },


  fn: async function (inputs, exits) {
    const {accessToken, skip} = inputs;
    let resp;
    console.log(skip)
    try {
      resp = await axios({
        method: 'get',
        url: `https://api.1up.health/fhir/dstu2/Patient/f8fedcd9e6e5/$everything?access_token=${accessToken}`,
        params: { _skip: skip || 0 }
      });
    } catch (error) {
      exits.generalServerError(error.response.data);
    }

    // Data return by FHIR route consists of multiple different resources. Here I made an educated guess as to what might be important information to display.
    // In a real business scenario, I would discuss the requirements with PM and design leads and configure the data as needed by the client. Either way, Normalizing the data
    // would be an important step - allowing consistent front end behavior.

    function formatData(resourceType, resource) {
      switch(resourceType) {
        case 'AllergyIntolerance':
          return {type: resourceType, status: resource.status, recorder: resource.recorder.display, substance: resource.substance.text };
        case 'CarePlan':
          return {type: resourceType, status: resource.status, goal: resource.goal[0].display};
        case 'Condition':
          return {type: resourceType, clinicalStatus: resource.clinicalStatus, code: resource.code.text };
        case 'DiagnosticReport':
          return {type: resourceType, status: resource.status, code: resource.code.text};
        case 'FamilyMemberHistory':
          return {type: resourceType, status: resource.status, date: resource.date};
        case 'Goal':
          return {type: resourceType, status: resource.status, goal: resource.description};
        case 'Immunization':
          return {type: resourceType, date: resource.date, status: resource.status, code: resource.vaccineCode.text};
        case 'MedicationStatement':
          return {type: resourceType, status: resource.status, medication: resource.medicationCodeableConcept.text};
        case 'Observation':
          return {type: resourceType, status: resource.status, comments: resource.code.text};
        case 'Device':
          return {type: resourceType, model: resource.model, status: resource.status};
        case 'Procedure':
          return {type: resourceType, code: resource.code.text, status: resource.status};
        case 'Patient':
          return {type: resourceType, active: resource.active, gender: resource.gender};
        default:
          return null;
      }
    }

    let data = resp.data.entry.map((entry)=>{
      return formatData(entry.resource.resourceType, entry.resource);
    });

    const formatedResponse = {
      resources: data,
      total: resp.data.total
    };

    return exits.success(formatedResponse);
  }
};
