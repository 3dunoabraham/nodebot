const { fetchPlayer } = require('./player');

async function generateInlineResults22(queryText,randdd) {
  const results = [];
  const textResult = {
    type: 'article',
    id: '1',
    name: 'name  Rrr #'+randdd,
    title: 'Text Result #'+randdd,
    subscription:0,
    input_message_content: {
      message_text: `You entered: ${queryText} \nYou got: ${randdd}`,
    },
  };
  
  // const foundHardcode = hardcode[queryText]
  let thePllayer = null;
  try {
    thePllayer = await fetchPlayer(queryText)
  } catch (error) {
    thePllayer = {name:`player not found`,subscription:0}
    
  }
  const betterResult = !thePllayer?.subscription ? textResult : {
    type: 'article',
    id: '1',
    title: '->Text Result +++'+thePllayer.name,
    input_message_content: {
      message_text: `ey: ${thePllayer.name} ye You entered: |${queryText}| \n${queryText.length}You got: ${randdd}`,
    },
  };
  results.push(betterResult);

  return results;
}