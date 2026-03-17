import axiosClient from "./axiosClient";

export const walletApi = {
  depositZaloPay(amount) {
    return axiosClient.post("/wallets/deposit/zalopay", { amount });
  },
  depositMoMo(amount) {
    return axiosClient.post("/wallets/deposit/momo", { amount });
  },
  getMyTransactions() {
    return axiosClient.get("/wallets/transactions/my");
  }
};
