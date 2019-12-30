import React from 'react';
import Button from '@material-ui/core/Button'

export enum AppleType {
  red = 'RED',
  green = 'GREEN',
}

export enum AppleSize {
  small = 'S',
  medium = 'M',
  large = 'L',
}

export interface AppleInterface {
  type: AppleType;
  size: AppleSize;
  origin: string;
  age: number;
}

export interface AppleProps {
  apple: AppleInterface;
}

export type AppleTestType = {
  age: number;
  name: string;
}

const Apple: React.FC<AppleProps> = (props) => {
  const { apple } = props;

  return (
    <div>
      {JSON.stringify(apple)}
    </div>
  );
}

export default Apple;
