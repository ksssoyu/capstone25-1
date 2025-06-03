 
import { ReactNode } from 'react';

import { Modal as MuiModal } from '@mui/material';

import { ModalContainer } from './modal.styled';

interface ModalProps {
  // open 여부
  open: boolean;
  // content 영역
  children: ReactNode;
  // 모달 닫기 함수
  onClose: () => void;
  // 모달 높이
  height?: string;
  // 모달 가로
  width?: string;
  // 모달 둥근 정도
  isBorder?: string;
}

const Modal = ({
  open,
  children,
  onClose,
  height,
  width,
  isBorder,
}: ModalProps) => {
  return (
    <MuiModal open={open} onClose={onClose}>
      <ModalContainer style={{ height, width, borderRadius: isBorder }}>
        {children}
      </ModalContainer>
    </MuiModal>
  );
};

export default Modal;

Modal.defaultProps = {
  height: 'auto', // 기본 높이 값 설정
  width: 'auto',
  isBorder: 'auto',
};
