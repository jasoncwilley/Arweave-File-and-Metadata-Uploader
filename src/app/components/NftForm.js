'use client';

import { useState } from 'react';
import Arweave from 'arweave';
import FileUpload from './FileUpload';

const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https',
});

export default function NftForm({ walletKey }) {
  const [metadata, setMetadata] = useState({
    name: '',
    description: '',
    image: '',
    attributes: [],
  });

  const [attribute, setAttribute] = useState({ trait_type: '', value: '' });
  const [loading, setLoading] = useState(false);
  const [txId, setTxId] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setMetadata({ ...metadata, [name]: value });
  };

  const handleAttributeChange = (e) => {
    const { name, value } = e.target;
    setAttribute({ ...attribute, [name]: value });
  };

  const addAttribute = () => {
    setMetadata({
      ...metadata,
      attributes: [...metadata.attributes, attribute],
    });
    setAttribute({ trait_type: '', value: '' });
  };

  const handleUpload = (url) => {
    setMetadata({ ...metadata, image: url });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    const metadataJSON = JSON.stringify(metadata, null, 2);

    try {
      const transaction = await arweave.createTransaction({ data: metadataJSON }, walletKey);
      transaction.addTag('Content-Type', 'application/json');

      await arweave.transactions.sign(transaction, walletKey);
      const response = await arweave.transactions.post(transaction);

      if (response.status === 200) {
        setTxId(transaction.id);
      } else {
        console.error('Failed to upload metadata JSON to Arweave');
      }
    } catch (error) {
      console.error('Error uploading metadata JSON to Arweave:', error);
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Name:</label>
        <input type="text" name="name" value={metadata.name} onChange={handleChange} required />
      </div>
      <div>
        <label>Description:</label>
        <textarea name="description" value={metadata.description} onChange={handleChange} required />
      </div>
      <div>
        <label>Image URL:</label>
        <input type="text" name="image" value={metadata.image} onChange={handleChange} required />
        <FileUpload onUpload={handleUpload} walletKey={walletKey} />
      </div>
      <div>
        <h4>Attributes:</h4>
        <label>Trait Type:</label>
        <input type="text" name="trait_type" value={attribute.trait_type} onChange={handleAttributeChange} />
        <label>Value:</label>
        <input type="text" name="value" value={attribute.value} onChange={handleAttributeChange} />
        <button type="button" onClick={addAttribute}>Add Attribute</button>
        <ul>
          {metadata.attributes.map((attr, index) => (
            <li key={index}>{`${attr.trait_type}: ${attr.value}`}</li>
          ))}
        </ul>
      </div>
      <button type="submit" disabled={loading}>
        {loading ? 'Uploading...' : 'Generate Metadata JSON'}
      </button>
      {txId && (
        <div>
          <h4>Transaction ID:</h4>
          <p>{txId}</p>
          <a href={`https://arweave.net/${txId}`} target="_blank" rel="noopener noreferrer">
            View on Arweave
          </a>
        </div>
      )}
    </form>
  );
}
