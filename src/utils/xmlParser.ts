import { SurvivalItem, ScoreEvaluation, Story, PRIMARY_LANG } from '../types';

/**
 * XML PARSER
 * Converts XML string from public/story.xml into JavaScript objects
 */
export const parseStoryXml = (xmlString: string) => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
  const getTag = (tag: string) => xmlDoc.getElementsByTagName(tag)[0]?.textContent || '';

  const photo = getTag('Logo') || 'login_page.png';
  const story: Story = {
    title: getTag('Title') || 'Mission Control',
    plot: getTag('Plot') || '',
    language: getTag('Language') || PRIMARY_LANG,
    photo: photo,
  };

  const evalNodes = xmlDoc.getElementsByTagName('Rank');
  const evaluations: ScoreEvaluation[] = Array.from(evalNodes).map(node => ({
    threshold: parseInt(node.getAttribute('threshold') || '999'),
    message: node.textContent || '',
  }));

  const itemNodes = xmlDoc.getElementsByTagName('Item');
  const items: SurvivalItem[] = [];
  for (let i = 0; i < itemNodes.length; i++) {
    const node = itemNodes[i];
    const id = node.getAttribute('id');
    if (id) {
      items.push({
        id,
        name: node.getElementsByTagName('Name')[0]?.textContent || '',
        photo: node.getElementsByTagName('Photo')[0]?.textContent || '',
        idealPosition: parseInt(node.getElementsByTagName('Position')[0]?.textContent || '15'),
        description: node.getElementsByTagName('Description')[0]?.textContent || '',
      });
    }
  }

  return { story, evaluations, items };
};
