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
      if (!res.ok) throw new Error(t("saveError"));
    }
  );

  const stepLabels = [
    t("personalInformation"),
    t("addressInsurance"),
    t("medicalHistory"),
    t("visitDetails"),
    t("consentReview"),
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

  const isStepComplete = (
    stepFields: (keyof PatientIntakeFormValues)[],
    values: PatientIntakeFormValues
  ) => {
    return stepFields.every(field => {
      const value = values[field];
      if (field === "consent") return Boolean(value);
      return value && value.toString().trim() !== "";
    });
  };

  return (
    <Card className="max-w-3xl mx-auto p-6 md:p-10 rounded-2xl shadow-xl">

      <h2 className="text-2xl font-semibold mb-6 text-center">
        {stepLabels[step]}
      </h2>

      <form onSubmit={handleSubmit(submit)} className="space-y-8">

        {/* === STEP 1 === */}
        {step === 0 && (
          <CardContent className="grid md:grid-cols-2 gap-6">

            <div>
              <label className="block mb-1 font-medium">
                {t("firstName")} <RequiredAsterisk />
              </label>
              <Input
                placeholder={t("firstName")}
                {...register('firstName', { required: true })}
              />
              {errors.firstName && <p className="text-red-500 text-xs">{t("required")}</p>}
            </div>

            <div>
              <label className="block mb-1 font-medium">
                {t("lastName")} <RequiredAsterisk />
              </label>
              <Input
                placeholder={t("lastName")}
                {...register('lastName', { required: true })}
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">
                {t("dateOfBirth")} <RequiredAsterisk />
              </label>
              <Input
                type="date"
                {...register('date_of_birth', { required: true })}
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">
                {t("gender")} <RequiredAsterisk />
              </label>
              <Input
                placeholder={t("gender")}
                {...register('gender', { required: true })}
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">
                {t("phone")} <RequiredAsterisk />
              </label>
              <Input
                placeholder={t("phone")}
                {...register('phone', { required: true })}
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">
                {t("email")} <RequiredAsterisk />
              </label>
              <Input
                type="email"
                placeholder={t("email")}
                {...register('email', { required: true })}
              />
            </div>

          </CardContent>
        )}

        {/* === STEP 2 === */}
        {step === 1 && (
          <CardContent className="grid md:grid-cols-2 gap-6">

            <div>
              <label className="block mb-1 font-medium">
                {t("address")} <RequiredAsterisk />
              </label>
              <Input placeholder={t("address")} {...register('address', { required: true })} />
            </div>

            <div>
              <label className="block mb-1 font-medium">
                {t("city")} <RequiredAsterisk />
              </label>
              <Input placeholder={t("city")} {...register('city', { required: true })} />
            </div>

            <div>
              <label className="block mb-1 font-medium">
                {t("province")} <RequiredAsterisk />
              </label>
              <Input placeholder={t("province")} {...register('province', { required: true })} />
            </div>

            <div>
              <label className="block mb-1 font-medium">
                {t("postalCode")} <RequiredAsterisk />
              </label>
              <Input placeholder={t("postalCode")} {...register('postalCode', { required: true })} />
            </div>

            <div>
              <label className="block mb-1 font-medium">
                {t("insuranceProvider")} <RequiredAsterisk />
              </label>
              <Input
                placeholder={t("insuranceProvider")}
                {...register('insuranceProvider', { required: true })}
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">
                {t("insuranceNumber")} <RequiredAsterisk />
              </label>
              <Input
                placeholder={t("insuranceNumber")}
                {...register('insuranceNumber', { required: true })}
              />
            </div>

          </CardContent>
        )}

        {/* === STEP 3 === */}
        {step === 2 && (
          <CardContent className="grid gap-6">

            <div>
              <label className="block mb-1 font-medium">{t("medicalConditions")}</label>
              <Input placeholder={t("medicalConditions")} {...register('medicalConditions')} />
            </div>

            <div>
              <label className="block mb-1 font-medium">{t("medications")}</label>
              <Input placeholder={t("medications")} {...register('medications')} />
            </div>

            <div>
              <label className="block mb-1 font-medium">{t("allergies")}</label>
              <Input placeholder={t("allergies")} {...register('allergies')} />
            </div>

          </CardContent>
        )}

        {/* === STEP 4 === */}
        {step === 3 && (
          <CardContent className="grid gap-6">

            <div>
              <label className="block mb-1 font-medium">
                {t("reasonForVisit")} <RequiredAsterisk />
              </label>
              <Input
                placeholder={t("reasonForVisit")}
                {...register('reasonForVisit', { required: true })}
              />
              {errors.reasonForVisit && <p className="text-red-500 text-xs">{t("required")}</p>}
            </div>

            <div>
              <label className="block mb-1 font-medium">
                {t("symptoms")} <RequiredAsterisk />
              </label>
              <Input
                placeholder={t("symptoms")}
                {...register('symptoms', { required: true })}
              />
              {errors.symptoms && <p className="text-red-500 text-xs">{t("required")}</p>}
            </div>

            <div>
              <label className="block mb-1 font-medium">{t("symptomOnset")}</label>
              <Input type="date" {...register('symptomOnset')} />
            </div>

          </CardContent>
        )}

        {/* === STEP 5 === */}
        {step === 4 && (
          <CardContent className="space-y-4">

            <p className="text-sm leading-relaxed">
              {t("reviewAndConsent")}
            </p>

            <div className="flex items-center space-x-2">
              <Checkbox id="consent" {...register('consent', { required: true })} />
              <label htmlFor="consent" className="text-sm">
                {t("consentText")} <RequiredAsterisk />
              </label>
            </div>

            {errors.consent && <p className="text-red-500 text-xs">{t("required")}</p>}
          </CardContent>
        )}

        {/* === Navigation === */}
        <div className="flex justify-between pt-4 items-center">
          <IconButton
            icon={<MdArrowBack size={24} />}
            type="button"
            onClick={back}
            disabled={step === 0}
          />

          {step < 4 ? (
            <IconButton
              icon={<MdArrowForward size={24} />}
              type="button"
              onClick={next}
            />
          ) : (
            <Button
              type="submit"
              disabled={!getValues().consent}
            >
              {t("submit")}
            </Button>
          )}
        </div>

      </form>
    </Card>
  );
}
