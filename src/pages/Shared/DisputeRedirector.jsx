import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import disputeApi from '../../api/dispute.api';
const DisputeRedirector = () => {
  const {
    t
  } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const contractId = searchParams.get('contractId');
  useEffect(() => {
    if (!contractId) {
      toast.error(t("auto.db_27144d"));
      navigate('/worker/dashboard');
      return;
    }
    const resolveDisputeId = async () => {
      try {
        const res = await disputeApi.getByContractId(contractId);
        const dispute = res.data;

        // If the response is an array (listAll behavior)
        const foundDispute = Array.isArray(dispute) ? dispute[0] : dispute;
        if (foundDispute && foundDispute.id) {
          navigate(`/disputes/${foundDispute.id}`);
        } else {
          toast.error(t("auto.db_f9356a"));
          navigate(-1);
        }
      } catch (err) {
        console.error('Failed to resolve dispute ID:', err);
        toast.error(t("auto.db_2b6b99"));
        navigate(-1);
      }
    };
    resolveDisputeId();
  }, [contractId]);
  return <div className="min-h-screen flex items-center justify-center text-cyan-500 font-mono uppercase tracking-[0.2em] animate-pulse text-[10px]">
            Searching_Conflict_Node...
        </div>;
};
export default DisputeRedirector;