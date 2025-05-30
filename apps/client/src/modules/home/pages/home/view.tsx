export default function HomePage() {
  // K8sCodebase.useWatchList();

  return (
    <>
      <div>Hello</div>

      {/* <div>
        <EditorYAML
          content={}
          // onClose={() => setOpen(false)}
          onSave={(yaml, json) => console.log("Saved:", json)}
          onChange={(yaml, json, err) => {
            if (err) console.error("Invalid YAML:", err.message);
          }}
        />
      </div> */}
    </>
  );
}
