import * as ethers from 'ethers';

export default async function handler(req, res) {
  const {
    query: { hash, network },
    method,
  } = req;

  const itx = new ethers.providers.InfuraProvider(
    network,
    process.env.INFURA_PROJECT_ID
  );

  const response = await itx.send('relay_getTransactionStatus', [hash]);

  const { broadcasts = [] } = response;

  const sortedBroadcast = broadcasts.sort((b1, b2) => {
    if (b1.gasPrice > b2.gasPrice) {
      return -1;
    }
    if (b1.gasPrice < b2.gasPrice) {
      return 1;
    }
    return 0;
  });

  switch (method) {
    case 'GET':
      res.status(200).json(
        sortedBroadcast
          .map((b) => {
            const { ethTxHash, confirmations } = b;
            return {
              txHash: ethTxHash,
              confirmations,
            };
          })
          .find(() => true)
      );
      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
