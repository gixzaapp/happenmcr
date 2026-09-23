import { POETS_CORNER_DISCLAIMER } from "@/lib/poets-corner";
import styles from "./poets-corner.module.css";

export function PoemDisclaimer() {
  return (
    <p className={`${styles.disclaimer} mt-8 max-w-2xl`}>{POETS_CORNER_DISCLAIMER}</p>
  );
}
