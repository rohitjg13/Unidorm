import React, { useState } from 'react';
import { Button, Select } from '@mantine/core';
import styles from './FloorDrawer.module.css';

const FloorDrawer: React.FC = () => {
  const [floor, setFloor] = useState<number | null>(1);

  const handleSelectFloor = () => {
    if (floor) {
      console.log(`Selected Floor: ${floor}`);
    }
  };

  return (
    <div className={styles.drawer}>
      <Select
        label="Select Floor"
        placeholder="Choose a floor"
        value={floor?.toString()}
        onChange={(value) => setFloor(value ? parseInt(value) : null)}
        data={[
          { value: '1', label: '1' },
          { value: '2', label: '2' },
          { value: '3', label: '3' },
          { value: '4', label: '4' },
          { value: '5', label: '5' },
        ]}
      />
      <Button onClick={handleSelectFloor} mt="md">
        Select Floor
      </Button>
    </div>
  );
};

export default FloorDrawer;