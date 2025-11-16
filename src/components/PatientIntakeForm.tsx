import { useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { MdArrowBack, MdArrowForward, MdWarning } from 'react-icons/md';
import { useParams } from 'react-router-dom';
import { useTranslation } from "react-i18next";
import { API_URL } from '../env_vars';
import logger from '../services/logging';
import {
  Button,
  Card,
  CardContent,
  Checkbox,
  IconButton,
  Input,
  RequiredAsterisk,
} from './FormComponents';

function useSimpleMutation<TPayload>(
  submitFn: (payload: TPayload) => Promise<any>
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<null | Error>(null);

  const mutate = async (payload: TPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      await submitFn(payload);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  return { mutate, isLoading, error };
}

interface PatientIntakeFormValues {
  firstName: string;
  lastName: string;
  date_of_birth: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  insuranceProvider: string;
  insuranceNumber: string;
  medicalConditions: string;
  medications: string;
  allergies: string;
  reasonForVisit: string;
  symptoms: string;
  symptomOnset: string;
  consent: boolean;
}

const initialValues: PatientIntakeFormValues = {
  firstName: '',
  lastName: '',
  date_of_birth: '',
  gender: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  province: '',
  postalCode: '',
  insuranceProvider: '',
  insuranceNumber: '',
  medicalConditions: '',
  medications: '',
  allergies: '',
  reasonForVisit: '',
  symptoms: '',
  symptomOnset: '',
  consent: false,
};

type Step = 0 | 1 | 2 | 3 | 4;

export default function PatientIntakeForm() {
  const { t } = useTranslation();
  const { patientId } = useParams<{ patientId: string }>();
  const [step, setStep] = useState<Step>(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    getValues,
  } = useForm<PatientIntakeFormValues>({
    defaultValues: initialValues,
    mode: 'onBlur',
  });

  const mutation = useSimpleMutation(
    async (data: Partial<PatientIntakeFormValues>): Promise<void> => {
      const res = await fetch(`${API_URL}/api/intake/${patientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(t("intakeForm.saveError"));
    }
  );

  const stepLabels = [
    t("step1"),
    t("step2"),
    t("step3"),
    t("step4"),
    t("step5"),
  ] as const;

  const stepFieldMap: Record<Step, (keyof PatientIntakeFormValues)[]> = {
    0: ['firstName', 'lastName', 'date_of_birth', 'gender', 'phone', 'email'],
    1: ['address', 'city', 'province', 'postalCode', 'insuranceProvider', 'insuranceNumber'],
    2: ['medicalConditions', 'medications', 'allergies'],
    3: ['reasonForVisit', 'symptoms', 'symptomOnset'],
    4: ['consent'],
  };

  const next = async () => {
    const valid = await trigger(stepFieldMap[step]);
    if (!valid) return;
    const payload = Object.fromEntries(stepFieldMap[step].map(k => [k, getValues(k)]));
    mutation.mutate(payload);
    if (step < 4) setStep((step + 1) as Step);
  };

  const back = () => step > 0 && setStep((step - 1) as Step);

  const submit: SubmitHandler<PatientIntakeFormValues> = async data => {
    await mutation.mutate(data);
  };

  return (
    <Card className="max-w-3xl mx-auto p-6 md:p-10 rounded-2xl shadow-xl">

      {/* Step Title */}
      <h2 className="text-2xl font-semibold mb-6 text-center">
        {stepLabels[step]}
      </h2>

      <form onSubmit={handleSubmit(submit)} className="space-y-8">

        {/* === STEP 1 === */}
        {step === 0 && (
          <CardContent className="grid md:grid-cols-2 gap-6">
            <label>{t("firstName")} <RequiredAsterisk /></label>
            <Input placeholder={t("firstName")} {...register('firstName', { required: true })}/>
            {errors.firstName && <p className="text-red-500 text-xs">{t("required")}</p>}

            <label>{t("lastName")} <RequiredAsterisk /></label>
            <Input placeholder={t("lastName")} {...register('lastName', { required: true })}/>

            <label>{t("dateOfBirth")} <RequiredAsterisk /></label>
            <Input type="date" {...register('date_of_birth', { required: true })}/>

            <label>{t("gender")} <RequiredAsterisk /></label>
            <Input placeholder={t("gender")} {...register('gender', { required: true })}/>

            <label>{t("phone")} <RequiredAsterisk /></label>
            <Input placeholder={t("phone")} {...register('phone', { required: true })}/>

            <label>{t("email")} <RequiredAsterisk /></label>
            <Input type="email" placeholder={t("email")} {...register('email', { required: true })}/>
          </CardContent>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-4 items-center">
          <IconButton icon={<MdArrowBack size={24}/>} onClick={back} disabled={step === 0}/>
          {step < 4 ? (
            <IconButton icon={<MdArrowForward size={24}/>} onClick={next}/>
          ) : (
            <Button type="submit" disabled={!getValues().consent}>
              {t("submit")}
            </Button>
          )}
        </div>

      </form>
    </Card>
  );
}
