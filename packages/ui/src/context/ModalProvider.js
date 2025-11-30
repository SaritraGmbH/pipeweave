"use client";

import { createContext, useContext, useState } from "react";

const ModalContext = createContext(undefined);

export default function GlobalModalProvider({ children }) {
	const [modals, setModals] = useState({
		auth: false,
		session_expired: false,
	});
	const [modalData, setModalData] = useState({
		auth: { panel: "signup", show_google_login: true },
	});

	const openModal = (id, data = {}) => {
		setModals((prev) => ({ ...prev, [id]: true }));
		if (data && Object.keys(data).length > 0) {
			setModalData((prev) => ({
				...prev,
				[id]: { ...prev[id], ...data },
			}));
		}
	};

	const closeModal = (id) => {
		setModals((prev) => ({ ...prev, [id]: false }));
	};

	const isModalOpen = (id) => {
		return modals[id] || false;
	};

	const getModalData = (id) => {
		return modalData[id] || {};
	};

	const updateModalData = (id, data) => {
		setModalData((prev) => ({
			...prev,
			[id]: { ...prev[id], ...data },
		}));
	};

	return (
		<ModalContext.Provider
			value={{
				modals,
				modalData,
				openModal,
				closeModal,
				isModalOpen,
				getModalData,
				updateModalData,
			}}
		>
			{children}
		</ModalContext.Provider>
	);
}

export function useModal() {
	const context = useContext(ModalContext);
	if (context === undefined) {
		throw new Error("useModal must be used within a ModalProvider");
	}
	return context;
}
